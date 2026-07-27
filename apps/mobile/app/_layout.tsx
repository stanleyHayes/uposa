import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { Fraunces_600SemiBold, Fraunces_700Bold, Fraunces_900Black } from '@expo-google-fonts/fraunces';
import { Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Brand, Colors, Fonts } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { AppThemeProvider } from '@/lib/theme-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { SplashScreen } from '@/components/splash-screen';

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
  const { isAuthenticated, isHydrating } = useAuthStore();

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

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);
  const palette = Colors[colorScheme ?? 'light'];
  const [fontsLoaded] = useFonts({
    'EuclidCircularA-Regular': require('../assets/fonts/EuclidCircularARegular.ttf'),
    'EuclidCircularA-Italic': require('../assets/fonts/EuclidCircularAItalic.ttf'),
    'EuclidCircularA-Medium': require('../assets/fonts/EuclidCircularAMedium.ttf'),
    'EuclidCircularA-MediumItalic': require('../assets/fonts/EuclidCircularAMediumItalic.ttf'),
    'EuclidCircularA-SemiBold': require('../assets/fonts/EuclidCircularASemiBold.ttf'),
    'EuclidCircularA-Bold': require('../assets/fonts/EuclidCircularABold.ttf'),
    'EuclidCircularA-BoldItalic': require('../assets/fonts/EuclidCircularABoldItalic.ttf'),
    'EuclidCircularA-Light': require('../assets/fonts/EuclidCircularALight.ttf'),
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_900Black,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  if (isHydrating || !fontsLoaded) {
    return <SplashScreen />;
  }

  const stackHeaderStyle = {
    headerStyle: { backgroundColor: palette.background },
    headerTitleStyle: { color: palette.text, fontFamily: Fonts.displayHeavy },
    headerTintColor: palette.text,
    headerShadowVisible: false,
  };

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === 'dark' ? darkNavTheme : lightNavTheme}>
        <AuthGate />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
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
          <Stack.Screen name="dues/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'My Dues', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="donations/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Donate', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="projects/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Projects' }} />
          <Stack.Screen name="projects/[slug]" options={{ ...stackHeaderStyle, headerShown: true, title: 'Project' }} />
          <Stack.Screen name="contact/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Contact', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="settings/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Settings', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="profile/edit" options={{ ...stackHeaderStyle, headerShown: true, title: 'Edit Profile', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="gallery/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Gallery', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="requests/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Requests', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="help/index" options={{ ...stackHeaderStyle, headerShown: true, title: 'Help', animation: 'slide_from_bottom' }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootLayoutContent />
    </AppThemeProvider>
  );
}
