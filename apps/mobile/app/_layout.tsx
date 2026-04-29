import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Brand, Colors } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { ErrorBoundary } from '@/components/error-boundary';

export const unstable_settings = {
  anchor: '(tabs)',
};

const lightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Brand.navy,
    background: Brand.cream,
    card: Brand.cream,
    text: Brand.navy,
    border: '#E8DFC0',
  },
};

const darkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Brand.goldLight,
    background: Brand.darkBg,
    card: Brand.darkBg2,
    text: Brand.cream,
    border: '#1a2f5a',
  },
};

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isHydrating, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrating) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isHydrating, segments, router]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const palette = Colors[colorScheme ?? 'light'];

  if (isHydrating) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator color={palette.tint} size="large" />
      </View>
    );
  }

  const stackHeaderStyle = {
    headerStyle: { backgroundColor: palette.surface },
    headerTitleStyle: { color: palette.text, fontWeight: '700' as const },
    headerTintColor: palette.text,
  };

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === 'dark' ? darkNavTheme : lightNavTheme}>
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="events/[slug]" options={{ ...stackHeaderStyle, headerShown: true, title: 'Event' }} />
          <Stack.Screen name="news/[slug]" options={{ ...stackHeaderStyle, headerShown: true, title: 'Article' }} />
          <Stack.Screen name="members/[id]" options={{ ...stackHeaderStyle, headerShown: true, title: 'Member' }} />
          <Stack.Screen name="forum/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Forum' }} />
          <Stack.Screen name="forum/[slug]" options={{ ...stackHeaderStyle, headerShown: true, title: 'Discussion' }} />
          <Stack.Screen name="polls/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Polls' }} />
          <Stack.Screen name="elections/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Elections' }} />
          <Stack.Screen name="jobs/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Jobs' }} />
          <Stack.Screen name="jobs/[id]" options={{ ...stackHeaderStyle, headerShown: true, title: 'Job' }} />
          <Stack.Screen name="mentorship/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Mentorship' }} />
          <Stack.Screen name="donations/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Donate' }} />
          <Stack.Screen name="projects/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Projects' }} />
          <Stack.Screen name="projects/[slug]" options={{ ...stackHeaderStyle, headerShown: true, title: 'Project' }} />
          <Stack.Screen name="contact/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Contact' }} />
          <Stack.Screen name="settings/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Settings' }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
