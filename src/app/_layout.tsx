import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/auth/auth-context';
import { SplashOverlay } from '@/components/brand/splash-overlay';
import { GridflowRealtimeProvider } from '@/realtime/gridflow-realtime-provider';
import { PushNotificationsManager } from '@/notifications/push-notifications-manager';
import { ThemeProvider, useTheme } from '@/theme';
import { BRAND } from '@/theme/brand';

// Hold the native launch screen (static first frame of the approved splash, on both platforms) until
// the React Native splash overlay has laid out; the overlay releases it (see SplashOverlay).
void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="stations/[id]" />
        <Stack.Screen name="sessions/[id]" />
        <Stack.Screen name="sessions/active" />
        <Stack.Screen name="journey/details" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="auth/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="auth/onboarding" options={{ presentation: 'card' }} />
        <Stack.Screen name="auth/vehicles" options={{ presentation: 'card' }} />
        <Stack.Screen name="auth/custom-vehicle" options={{ presentation: 'card' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const appReady = fontsLoaded || Boolean(fontError);

  // The splash overlay lives at a fixed position at the very top of the tree so it paints as soon
  // as JS starts (before fonts / providers) and is never remounted when the app tree appears behind
  // it. The Obsidian wrapper guarantees no white frame at any point.
  return (
    <View style={{ flex: 1, backgroundColor: BRAND.obsidian }}>
      {appReady ? (
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <GridflowRealtimeProvider>
                <PushNotificationsManager />
                <RootNavigator />
              </GridflowRealtimeProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      ) : null}
      <SplashOverlay appReady={appReady} />
    </View>
  );
}
