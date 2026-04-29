import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const WEB_URL =
  (Constants.expoConfig?.extra as { webUrl?: string } | undefined)?.webUrl ||
  'https://uposa.org';

export default function RegisterScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.scroll}
    >
      <View style={styles.brandBlock}>
        <View style={[styles.logoCircle, { backgroundColor: Brand.navy }]}>
          <Text style={[styles.logoMark, { color: Brand.gold }]}>U</Text>
        </View>
        <Text style={[styles.brand, { color: palette.text }]}>Join UPOSA Alumni</Text>
        <Text style={[styles.tagline, { color: palette.textMuted }]}>
          New member registration includes a profile photo and your year-group details — best
          completed on our web portal.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Ionicons name="information-circle-outline" size={26} color={palette.tint} />
        <Text style={[styles.cardTitle, { color: palette.text }]}>Register on the web</Text>
        <Text style={[styles.cardBody, { color: palette.textMuted }]}>
          Open our web portal in your browser to complete the full registration form. Once
          approved by the executives, sign in here with your email and password.
        </Text>

        <Pressable
          onPress={() => Linking.openURL(`${WEB_URL}/register`)}
          style={({ pressed }) => [
            styles.btnPrimary,
            { backgroundColor: Brand.navy, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.btnPrimaryText}>Open Web Portal</Text>
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.linkRow} hitSlop={6}>
            <Text style={[styles.linkText, { color: palette.textMuted }]}>
              Already a member?{' '}
              <Text style={{ color: palette.tint, fontWeight: '600' }}>Sign in</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brandBlock: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoMark: { fontSize: 30, fontWeight: '800' },
  brand: { fontSize: 22, fontWeight: '700' },
  tagline: { fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  cardBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  btnPrimary: {
    marginTop: 18,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  btnPrimaryText: { color: Brand.cream, fontSize: 16, fontWeight: '700' },
  linkRow: { alignItems: 'center', marginTop: 14 },
  linkText: { fontSize: 14 },
});
