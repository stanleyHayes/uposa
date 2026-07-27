import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { Brand, Colors, Fonts, Radii, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemePreference } from '@/lib/theme-context';
import { useDrawerStore } from '@/lib/drawer-store';

export function AppToolbar() {
  const scheme = useColorScheme() ?? 'light';
  const palette: Palette = Colors[scheme];
  const router = useRouter();
  const openDrawer = useDrawerStore((s) => s.open);
  const { setPreferenceAt } = useThemePreference();
  const isDark = scheme === 'dark';

  return (
    <View style={[styles.bar, { backgroundColor: palette.background, borderBottomColor: palette.border }]}>
      <Pressable onPress={openDrawer} hitSlop={10} style={styles.iconButton}>
        <Ionicons name="menu" size={24} color={palette.text} />
      </Pressable>

      <View style={styles.brand}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} contentFit="contain" />
        <Text style={[styles.brandName, { color: palette.text }]}>UPOSA Alumni</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={(e) => {
            setPreferenceAt({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }, isDark ? 'light' : 'dark');
          }}
          hitSlop={10}
          style={styles.iconButton}
        >
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={palette.text} />
        </Pressable>
        <Pressable onPress={() => router.push('/help')} hitSlop={10} style={styles.iconButton}>
          <Ionicons name="help-circle-outline" size={22} color={Brand.gold} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 30, height: 30 },
  brandName: { fontSize: 17, fontFamily: Fonts.displayHeavy, letterSpacing: -0.3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { padding: 6, ...Radii.tile },
});
