import { Platform } from 'react-native';

export const Brand = {
  navy: '#001B50',
  navyDeep: '#000F30',
  navyAccent: '#003380',
  navyLight: '#4A7BC7',
  gold: '#D4AF37',
  goldLight: '#E8C84A',
  cream: '#FFF8DC',
  creamMuted: '#F5EDCF',
  creamSoft: '#EBE3C3',
  darkBg: '#0a1a3a',
  darkBg2: '#0d1f42',
  darkBg3: '#112550',
} as const;

export type Palette = {
  text: string;
  textMuted: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  tint: string;
  accent: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  danger: string;
  success: string;
};

export const Colors: { light: Palette; dark: Palette } = {
  light: {
    text: Brand.navy,
    textMuted: '#5A6478',
    background: Brand.cream,
    surface: '#FFFFFF',
    surfaceMuted: Brand.creamMuted,
    border: '#E8DFC0',
    tint: Brand.navy,
    accent: Brand.gold,
    icon: Brand.navy,
    tabIconDefault: '#8A8775',
    tabIconSelected: Brand.navy,
    danger: '#B0413E',
    success: '#2F855A',
  },
  dark: {
    text: Brand.cream,
    textMuted: '#A8B0C8',
    background: Brand.darkBg,
    surface: Brand.darkBg2,
    surfaceMuted: Brand.darkBg3,
    border: '#1a2f5a',
    tint: Brand.navyLight,
    accent: Brand.goldLight,
    icon: Brand.cream,
    tabIconDefault: '#5A6890',
    tabIconSelected: Brand.goldLight,
    danger: '#E0716E',
    success: '#68D391',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
