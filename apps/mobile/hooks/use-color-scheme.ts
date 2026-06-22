import { useContext } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { ThemeContext } from '@/lib/theme-context';

export type AppColorScheme = 'light' | 'dark';

/**
 * Effective color scheme. Prefers the in-app theme override (AppThemeProvider);
 * falls back to the device system scheme when no provider is mounted.
 */
export function useColorScheme(): AppColorScheme {
  const ctx = useContext(ThemeContext);
  const system = useRNColorScheme();
  if (ctx) return ctx.scheme;
  return system === 'dark' ? 'dark' : 'light';
}
