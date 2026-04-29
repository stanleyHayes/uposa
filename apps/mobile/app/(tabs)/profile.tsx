import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/auth-store';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const onLogout = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to access your account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (!user) return null;

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.scroll}
    >
      <View style={[styles.header, { backgroundColor: Brand.navy }]}>
        {user.photoUrl ? (
          <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>{user.fullName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.headerTags}>
          {user.yearGroup ? (
            <View style={[styles.headerTag, { backgroundColor: Brand.gold }]}>
              <Text style={styles.headerTagText}>Class of {user.yearGroup}</Text>
            </View>
          ) : null}
          {user.house ? (
            <View style={[styles.headerTag, { backgroundColor: 'rgba(255,248,220,0.15)' }]}>
              <Text style={[styles.headerTagText, { color: Brand.cream }]}>{user.house}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Section title="About" palette={palette}>
        <Row icon="briefcase-outline" label="Occupation" value={user.occupation ?? '—'} palette={palette} />
        <Row icon="business-outline" label="Organization" value={user.organization ?? '—'} palette={palette} />
        <Row icon="school-outline" label="Programme" value={user.programme ?? '—'} palette={palette} />
      </Section>

      <Section title="Contact" palette={palette}>
        <Row icon="call-outline" label="Phone" value={user.mobileNumber ?? '—'} palette={palette} />
        <Row
          icon="location-outline"
          label="Location"
          value={[user.city, user.region, user.country].filter(Boolean).join(', ') || '—'}
          palette={palette}
        />
      </Section>

      <Section title="Membership" palette={palette}>
        <Row
          icon="shield-checkmark-outline"
          label="Status"
          value={user.membershipStatus}
          palette={palette}
        />
        <Row
          icon="people-outline"
          label="Mentor"
          value={user.isAvailableAsMentor ? 'Available' : 'Not available'}
          palette={palette}
        />
      </Section>

      <Pressable
        onPress={onLogout}
        style={({ pressed }) => [
          styles.logoutBtn,
          { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Ionicons name="log-out-outline" size={18} color={palette.danger} />
        <Text style={[styles.logoutText, { color: palette.danger }]}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({
  title,
  palette,
  children,
}: {
  title: string;
  palette: Palette;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  palette,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  palette: Palette;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: palette.border }]}>
      <Ionicons name={icon} size={18} color={palette.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: palette.textMuted }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: palette.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  header: {
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12 },
  avatarFallback: {
    backgroundColor: 'rgba(255,248,220,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: Brand.gold, fontSize: 36, fontWeight: '800' },
  name: { color: Brand.cream, fontSize: 20, fontWeight: '700' },
  email: { color: Brand.cream, opacity: 0.85, fontSize: 13, marginTop: 2 },
  headerTags: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  headerTag: { paddingHorizontal: 10, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTagText: { color: Brand.navy, fontSize: 12, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginTop: 18 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 },
  sectionCard: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 11, letterSpacing: 0.3 },
  rowValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
});
