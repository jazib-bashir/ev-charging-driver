import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  resolveIsOnboarded,
  whoAmI,
  type WhoAmIResponse,
} from '@/api/auth';
import {
  clearAccessToken,
  readAccessToken,
  saveAccessToken,
} from '@/auth/token-storage';

export type PendingBooking = {
  stationId: string;
  chargerId: string;
};

type AuthContextValue = {
  token: string | null;
  user: WhoAmIResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  pendingBooking: PendingBooking | null;
  setPendingBooking: (booking: PendingBooking | null) => void;
  setSession: (token: string) => Promise<WhoAmIResponse>;
  refreshUser: () => Promise<WhoAmIResponse | null>;
  logout: () => Promise<void>;
  ensureAuthenticatedUser: () => Promise<WhoAmIResponse | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<WhoAmIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);

  const logout = useCallback(async () => {
    await clearAccessToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const activeToken = token ?? (await readAccessToken());

    if (!activeToken) {
      setToken(null);
      setUser(null);
      return null;
    }

    try {
      const nextUser = await whoAmI(activeToken);
      setToken(activeToken);
      setUser(nextUser);
      return nextUser;
    } catch {
      await clearAccessToken();
      setToken(null);
      setUser(null);
      return null;
    }
  }, [token]);

  const setSession = useCallback(async (nextToken: string) => {
    await saveAccessToken(nextToken);
    const nextUser = await whoAmI(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const ensureAuthenticatedUser = useCallback(async () => {
    if (user && token) {
      return user;
    }

    return refreshUser();
  }, [refreshUser, token, user]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const storedToken = await readAccessToken();
        if (!storedToken) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        const nextUser = await whoAmI(storedToken);
        if (!isMounted) {
          return;
        }

        setToken(storedToken);
        setUser(nextUser);
      } catch {
        await clearAccessToken();
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: Boolean(token && user),
      isOnboarded: resolveIsOnboarded(user),
      pendingBooking,
      setPendingBooking,
      setSession,
      refreshUser,
      logout,
      ensureAuthenticatedUser,
    }),
    [
      token,
      user,
      isLoading,
      pendingBooking,
      setSession,
      refreshUser,
      logout,
      ensureAuthenticatedUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
