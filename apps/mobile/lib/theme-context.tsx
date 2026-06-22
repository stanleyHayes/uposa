import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, useColorScheme as useSystemColorScheme } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Brand } from '@/constants/theme';

export type ThemeScheme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'uposa-mobile-theme';

type ThemeContextValue = {
  /** Effective scheme after resolving "system". */
  scheme: ThemeScheme;
  /** The user's stored preference. */
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function backgroundFor(scheme: ThemeScheme): string {
  return scheme === 'dark' ? Brand.darkBg : Brand.cream;
}

/**
 * Provides the app theme with a user override (light / dark / system), persisted
 * via AsyncStorage. A theme change is animated as a full-screen crossfade: the
 * previous background covers the screen and fades out, revealing the newly
 * themed UI underneath (powered by Reanimated).
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme: ThemeScheme = useSystemColorScheme() === 'dark' ? 'dark' : 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const scheme: ThemeScheme = preference === 'system' ? systemScheme : preference;

  const overlayOpacity = useSharedValue(0);
  const [overlayColor, setOverlayColor] = useState(() => backgroundFor(scheme));
  const hydrated = useRef(false);

  // Load the saved preference once on mount.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setPreferenceState(saved);
        }
      })
      .finally(() => {
        hydrated.current = true;
      });
  }, []);

  const setPreference = (next: ThemePreference) => {
    const nextScheme: ThemeScheme = next === 'system' ? systemScheme : next;
    // Only animate a real, user-initiated visual change (not the initial hydrate).
    if (hydrated.current && nextScheme !== scheme) {
      setOverlayColor(backgroundFor(scheme));
      overlayOpacity.value = 1;
      overlayOpacity.value = withTiming(0, { duration: 420 });
    }
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const toggle = () => setPreference(scheme === 'dark' ? 'light' : 'dark');

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  return (
    <ThemeContext.Provider value={{ scheme, preference, setPreference, toggle }}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor, zIndex: 9999 }, overlayStyle]}
      />
    </ThemeContext.Provider>
  );
}

export function useThemePreference(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePreference must be used within AppThemeProvider');
  return ctx;
}

export { ThemeContext };
