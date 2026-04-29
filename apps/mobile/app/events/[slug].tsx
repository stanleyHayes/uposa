import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { eventsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { Event } from '@/lib/types';

export default function EventDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const user = useAuthStore((s) => s.user);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.mobileNumber ?? '');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await eventsApi.getBySlug(slug);
      setEvent(res.data.data ?? null);
    } catch {
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const onRsvp = async () => {
    if (!event) return;
    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing details', 'Please provide your name and email.');
      return;
    }
    setSubmitting(true);
    try {
      await eventsApi.rsvp(event.id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
      });
      Alert.alert('You’re going!', 'Your RSVP has been recorded.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not record your RSVP.';
      Alert.alert('RSVP failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.textMuted }}>Event not found.</Text>
      </View>
    );
  }

  const date = new Date(event.date);
  const isPast = event.status === 'PAST' || date < new Date();

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.scroll}
    >
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={styles.cover} resizeMode="cover" />
      ) : null}

      <View style={styles.body}>
        <Text style={[styles.title, { color: palette.text }]}>{event.title}</Text>

        <View style={[styles.metaCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color={palette.textMuted} />
            <Text style={[styles.metaText, { color: palette.text }]}>
              {date.toLocaleString('en', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
          {event.location ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={palette.textMuted} />
              <Text style={[styles.metaText, { color: palette.text }]}>{event.location}</Text>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <Ionicons name="information-circle-outline" size={16} color={palette.textMuted} />
            <Text style={[styles.metaText, { color: palette.text }]}>{event.status}</Text>
          </View>
        </View>

        <Text style={[styles.description, { color: palette.text }]}>{event.description}</Text>

        {!isPast ? (
          <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.formTitle, { color: palette.text }]}>RSVP</Text>
            <Field label="Name" value={name} onChange={setName} palette={palette} />
            <Field label="Email" value={email} onChange={setEmail} palette={palette} keyboardType="email-address" />
            <Field label="Phone (optional)" value={phone} onChange={setPhone} palette={palette} keyboardType="phone-pad" />

            <Pressable
              onPress={onRsvp}
              disabled={submitting}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: Brand.navy, opacity: pressed || submitting ? 0.85 : 1 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={Brand.cream} />
              ) : (
                <Text style={styles.btnText}>Confirm RSVP</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={[styles.pastCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
            <Ionicons name="time-outline" size={18} color={palette.textMuted} />
            <Text style={{ color: palette.textMuted }}>This event has already passed.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChange,
  palette,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  palette: Palette;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={[styles.fieldLabel, { color: palette.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholderTextColor={palette.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        autoCorrect={false}
        style={[
          styles.fieldInput,
          { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cover: { width: '100%', height: 220 },
  body: { padding: 16, gap: 14 },
  title: { fontSize: 22, fontWeight: '800' },
  metaCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 13 },
  description: { fontSize: 14, lineHeight: 21 },
  formCard: {
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  fieldInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  btn: {
    marginTop: 18,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: Brand.cream, fontWeight: '700', fontSize: 15 },
  pastCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
});
