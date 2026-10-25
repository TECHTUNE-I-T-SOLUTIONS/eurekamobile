import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { useAppStore } from '../src/store/useAppStore';
import { AnimatedSplashScreen } from '../src/components/ui/AnimatedSplashScreen';

function RootLayoutNav() {
  const { user, loading: authLoading } = useAuth();
  const {
    hasCompletedOnboarding,
    isLoadingOnboarding,
    checkOnboardingStatus,
  } = useAppStore();
  const { theme } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
    // Allow the designed animated splash screen to play smoothly on launch
    const timer = setTimeout(() => {
      setMinSplashDone(true);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  const isAppLoading = authLoading || isLoadingOnboarding || !minSplashDone;

  useEffect(() => {
    if (isAppLoading) return;

    const firstSegment = segments[0] as string | undefined;
    const secondSegment = (segments as string[])[1];

    const inAuthGroup = firstSegment === '(auth)';
    const inTabsGroup = firstSegment === '(tabs)';

    if (!hasCompletedOnboarding) {
      if (secondSegment !== 'welcome' && secondSegment !== 'onboarding') {
        router.replace('/(auth)/welcome');
      }
    } else if (!user) {
      if (inTabsGroup || (inAuthGroup && secondSegment === 'welcome')) {
        router.replace('/(auth)/login');
      }
    } else {
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [user, isAppLoading, hasCompletedOnboarding, segments]);

  if (isAppLoading) {
    return <AnimatedSplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
