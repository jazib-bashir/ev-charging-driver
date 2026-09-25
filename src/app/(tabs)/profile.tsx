import { router, type Href, useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { ProfileScreen } from '@/components/profile/profile-screen';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useTheme } from '@/theme';

export default function ProfileTabScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  const redirectToLogin = useCallback(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth' as Href);
    }
  }, [isLoading, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      redirectToLogin();
    }, [redirectToLogin]),
  );

  // After logout while already on Profile, send to phone login immediately.
  useEffect(() => {
    redirectToLogin();
  }, [redirectToLogin]);

  if (isLoading || !isAuthenticated) {
    return (
      <ScreenContainer
        edges={['top']}
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View style={{ flex: 1 }} />
      </ScreenContainer>
    );
  }

  return <ProfileScreen />;
}
