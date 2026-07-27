import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  useColorScheme as useSystemColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Brand } from '@/constants/theme';

export type ThemeScheme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'uposa-mobile-theme';

type RevealOrigin = { x: number; y: number };

type ThemeContextValue = {
  /** Effective scheme after resolving "system". */
  scheme: ThemeScheme;
  /** The user's stored preference. */
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  /**
   * Change the preference with a circular reveal expanding from `origin`
   * (screen coordinates). Pass `null` for the plain crossfade used by
   * setPreference.
   */
  setPreferenceAt: (origin: RevealOrigin | null, next: ThemePreference) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function backgroundFor(scheme: ThemeScheme): string {
  return scheme === 'dark' ? Brand.darkBg : Brand.cream;
}

/**
 * Provides the app theme with a user override (light / dark / system), persisted
 * via AsyncStorage. A theme change is animated in one of two ways (plain RN
 * Animated — works on web and native):
 * - `setPreferenceAt` with an origin: a circle carrying the NEW theme's
 *   background expands from the tap point until it covers the screen, the
 *   scheme flips underneath, and the circle fades out.
 * - `setPreference` (origin === null): the previous background covers the
 *   screen and fades out, revealing the newly themed UI underneath.
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme: ThemeScheme = useSystemColorScheme() === 'dark' ? 'dark' : 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const scheme: ThemeScheme = preference === 'system' ? systemScheme : preference;

  const [overlayOpacity] = useState(() => new Animated.Value(0));
  const [overlayColor, setOverlayColor] = useState(() => backgroundFor(scheme));
  const hydrated = useRef(false);
  const reduceMotion = useRef(false);

  // Circular reveal state: a circle centered on the tap point that scales up
  // to cover the screen, then fades out after the scheme flips.
  const [circleScale] = useState(() => new Animated.Value(0));
  const [circleOpacity] = useState(() => new Animated.Value(0));
  const [circle, setCircle] = useState<{ x: number; y: number; radius: number; color: string } | null>(null);

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

  // Check reduced-motion preference once on mount.
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        reduceMotion.current = enabled;
      })
      .catch(() => {});
  }, []);

  const applyPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const setPreference = (next: ThemePreference) => {
    const nextScheme: ThemeScheme = next === 'system' ? systemScheme : next;
    // Only animate a real, user-initiated visual change (not the initial hydrate).
    if (hydrated.current && !reduceMotion.current && nextScheme !== scheme) {
      setOverlayColor(backgroundFor(scheme));
      overlayOpacity.setValue(1);
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
    applyPreference(next);
  };

  const setPreferenceAt = (origin: RevealOrigin | null, next: ThemePreference) => {
    const nextScheme: ThemeScheme = next === 'system' ? systemScheme : next;
    // Plain crossfade path (settings tiles) and no-op / reduced-motion fallbacks.
    if (origin === null) {
      setPreference(next);
      return;
    }
    if (reduceMotion.current || !hydrated.current || nextScheme === scheme) {
      applyPreference(next);
      return;
    }

    const { width, height } = Dimensions.get('window');
    const coverRadius = Math.hypot(Math.max(origin.x, width - origin.x), Math.max(origin.y, height - origin.y));

    // The circle carries the NEW scheme's background and expands from the tap point.
    setCircle({ x: origin.x, y: origin.y, radius: coverRadius, color: backgroundFor(nextScheme) });
    circleScale.setValue(0);
    circleOpacity.setValue(1);
    Animated.timing(circleScale, {
      toValue: 1,
      duration: 500,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      // Circle fully covers the screen — flip the scheme underneath, then fade out.
      applyPreference(next);
      Animated.timing(circleOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: false,
      }).start(({ finished: fadeFinished }) => {
        if (fadeFinished) setCircle(null);
      });
    });
  };

  const toggle = () => setPreference(scheme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ scheme, preference, setPreference, setPreferenceAt, toggle }}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor, zIndex: 9999, opacity: overlayOpacity }]}
      />
      {circle && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: circle.radius * 2,
            height: circle.radius * 2,
            borderRadius: circle.radius,
            backgroundColor: circle.color,
            top: circle.y - circle.radius,
            left: circle.x - circle.radius,
            zIndex: 9999,
            opacity: circleOpacity,
            transform: [{ scale: circleScale }],
          }}
        />
      )}
    </ThemeContext.Provider>
  );
}

export function useThemePreference(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePreference must be used within AppThemeProvider');
  return ctx;
}

export { ThemeContext };
