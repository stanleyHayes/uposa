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

/**
 * Font family tokens. React Native does not synthesize weights of custom
 * families (especially on Android), so each weight is its own family and
 * styles must set `fontFamily` WITHOUT a `fontWeight` property.
 *
 * - display/displayHeavy: Fraunces — page titles, hero titles, big numbers
 * - body…bodyBold: Euclid Circular A — all body text
 * - status/statusBold: Outfit — eyebrows, uppercase labels, pills, buttons
 */
export const Fonts = {
  display: 'Fraunces_700Bold',
  displayHeavy: 'Fraunces_900Black',
  body: 'EuclidCircularA-Regular',
  bodyItalic: 'EuclidCircularA-Italic',
  bodyMedium: 'EuclidCircularA-Medium',
  bodySemiBold: 'EuclidCircularA-SemiBold',
  bodyBold: 'EuclidCircularA-Bold',
  status: 'Outfit_600SemiBold',
  statusBold: 'Outfit_800ExtraBold',
} as const;

export type BodyFontWeight = '400' | '500' | '600' | '700' | '800' | '900';

/** Maps a numeric font weight to the matching Euclid Circular A family. */
export function fontForWeight(weight: BodyFontWeight): string {
  switch (weight) {
    case '400':
      return Fonts.body;
    case '500':
      return Fonts.bodyMedium;
    case '600':
      return Fonts.bodySemiBold;
    case '700':
    case '800':
    case '900':
      return Fonts.bodyBold;
  }
}

// Web apps are square-cornered — keep all radii at 0 to match.
const zero = {
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
  borderBottomLeftRadius: 0,
} as const;

export const Radii = {
  card: zero,
  hero: zero,
  button: zero,
  tile: zero,
} as const;
