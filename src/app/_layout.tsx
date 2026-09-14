import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/auth/auth-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const onLayoutRootView = useCallback(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="stations/[id]" />
            <Stack.Screen name="auth/index" options={{ presentation: 'card' }} />
            <Stack.Screen name="auth/onboarding" options={{ presentation: 'card' }} />
            <Stack.Screen name="auth/vehicles" options={{ presentation: 'card' }} />
            <Stack.Screen name="auth/custom-vehicle" options={{ presentation: 'card' }} />
          </Stack>
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
