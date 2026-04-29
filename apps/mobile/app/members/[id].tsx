import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { membersApi } from '@/lib/api';
import type { Member } from '@/lib/types';

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await membersApi.getById(id);
      setMember(res.data.data ?? null);
    } catch {
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.textMuted }}>Member not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.scroll}
    >
      <View style={[styles.header, { backgroundColor: Brand.navy }]}>
        {member.photoUrl ? (
          <Image source={{ uri: member.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>{member.fullName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.name}>{member.fullName}</Text>
        <Text style={styles.subtitle}>
          {[member.occupation, member.organization].filter(Boolean).join(' · ') || 'Alumnus'}
        </Text>

        <View style={styles.tagRow}>
          {member.yearGroup ? (
            <View style={[styles.headerTag, { backgroundColor: Brand.gold }]}>
              <Text style={styles.headerTagText}>Class of {member.yearGroup}</Text>
            </View>
          ) : null}
          {member.house ? (
            <View style={[styles.headerTag, { backgroundColor: 'rgba(255,248,220,0.15)' }]}>
              <Text style={[styles.headerTagText, { color: Brand.cream }]}>{member.house}</Text>
            </View>
          ) : null}
          {member.isAvailableAsMentor ? (
            <View style={[styles.headerTag, { backgroundColor: Brand.gold }]}>
              <Text style={styles.headerTagText}>Mentor</Text>
            </View>
          ) : null}
        </View>
      </View>

      {member.mentorBio ? (
        <Section title="Mentor bio" palette={palette}>
          <Text style={[styles.bodyText, { color: palette.text }]}>{member.mentorBio}</Text>
        </Section>
      ) : null}

      {member.areaOfExpertise && member.areaOfExpertise.length > 0 ? (
        <Section title="Expertise" palette={palette}>
          <View style={styles.expertiseRow}>
            {member.areaOfExpertise.map((tag) => (
              <View
                key={tag}
                style={[styles.exp, { backgroundColor: Brand.cream, borderColor: palette.border }]}
              >
                <Text style={[styles.expText, { color: Brand.navy }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      <Section title="Contact" palette={palette}>
        <Row icon="mail-outline" label="Email" value={member.email} palette={palette} onPress={() => Linking.openURL(`mailto:${member.email}`)} />
        {member.mobileNumber ? (
          <Row
            icon="call-outline"
            label="Phone"
            value={member.mobileNumber}
            palette={palette}
            onPress={() => member.mobileNumber && Linking.openURL(`tel:${member.mobileNumber}`)}
          />
        ) : null}
        <Row
          icon="location-outline"
          label="Location"
          value={[member.city, member.region, member.country].filter(Boolean).join(', ') || '—'}
          palette={palette}
        />
      </Section>

      <Section title="Programme" palette={palette}>
        <Row icon="school-outline" label="Programme" value={member.programme ?? '—'} palette={palette} />
        <Row
          icon="shield-checkmark-outline"
          label="Membership"
          value={member.membershipStatus}
          palette={palette}
        />
      </Section>
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
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  palette: Palette;
  onPress?: () => void;
}) {
  const content = (
    <View style={[styles.row, { borderBottomColor: palette.border }]}>
      <Ionicons name={icon} size={18} color={palette.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: palette.textMuted }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: palette.text }]}>{value}</Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={palette.textMuted} /> : null}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingTop: 24,
    paddingBottom: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  avatarFallback: {
    backgroundColor: 'rgba(255,248,220,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: Brand.gold, fontSize: 38, fontWeight: '800' },
  name: { color: Brand.cream, fontSize: 22, fontWeight: '800' },
  subtitle: { color: Brand.cream, opacity: 0.85, fontSize: 13, marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  headerTag: { paddingHorizontal: 10, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTagText: { color: Brand.navy, fontSize: 12, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginTop: 18 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 },
  sectionCard: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 11, letterSpacing: 0.3 },
  rowValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  bodyText: { fontSize: 14, lineHeight: 21, paddingVertical: 8 },
  expertiseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 8 },
  exp: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expText: { fontSize: 11, fontWeight: '600' },
});
