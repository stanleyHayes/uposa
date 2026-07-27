import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { eventsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { Event } from '@/lib/types';
import {
  DetailRow,
  EmptyState,
  Field,
  HeroPanel,
  LoadingState,
  Pill,
  PrimaryButton,
  ScreenScroll,
  Surface,
  formatDateTime,
} from '@/components/mobile-ui';
import { MarkdownBody } from '@/components/markdown';

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
      Alert.alert('You are going', 'Your RSVP has been recorded.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not record your RSVP.';
      Alert.alert('RSVP failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState palette={palette} title="Event" />;

  if (!event) {
    return (
      <ScreenScroll palette={palette}>
        <EmptyState palette={palette} icon="calendar-outline" title="Event not found" description="This event may have been removed or unpublished." />
      </ScreenScroll>
    );
  }

  const date = new Date(event.date);
  const isPast = event.status === 'PAST' || date < new Date();

  return (
    <ScreenScroll palette={palette} keyboardShouldPersistTaps="handled" padded={false}>
      {event.imageUrl ? <Image source={{ uri: event.imageUrl }} style={{ width: '100%', height: 230 }} resizeMode="cover" /> : null}
      <View style={{ padding: 16 }}>
        <HeroPanel
          palette={palette}
          eyebrow={event.status}
          title={event.title}
          icon="calendar-outline"
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Pill palette={palette} tone="gold">{formatDateTime(event.date)}</Pill>
            {event.location ? <Pill palette={palette} tone="navy">{event.location}</Pill> : null}
          </View>
        </HeroPanel>

        {event.description ? (
          <Surface palette={palette} style={{ padding: 16 }}>
            <MarkdownBody palette={palette}>{event.description}</MarkdownBody>
          </Surface>
        ) : null}

        <View style={{ gap: 10, marginTop: event.description ? 14 : 0 }}>
          <DetailRow palette={palette} icon="calendar-outline" label="When" value={formatDateTime(event.date)} />
          {event.location ? <DetailRow palette={palette} icon="location-outline" label="Where" value={event.location} /> : null}
          <DetailRow palette={palette} icon="information-circle-outline" label="Status" value={event.status} />
        </View>

        {!isPast ? (
          <Surface palette={palette} style={{ padding: 16, gap: 2, marginTop: 18 }}>
            <Text style={{ color: palette.text, fontSize: 18, fontFamily: Fonts.display, marginBottom: 8 }}>RSVP</Text>
            <Field palette={palette} label="Name" value={name} onChangeText={setName} icon="person-outline" />
            <Field palette={palette} label="Email" value={email} onChangeText={setEmail} icon="mail-outline" keyboardType="email-address" />
            <Field palette={palette} label="Phone" value={phone} onChangeText={setPhone} icon="call-outline" keyboardType="phone-pad" />
            <PrimaryButton label="Confirm RSVP" palette={palette} onPress={onRsvp} loading={submitting} icon="checkmark-done-outline" />
          </Surface>
        ) : (
          <Surface palette={palette} tone="muted" style={{ padding: 14, marginTop: 18 }}>
            <Text style={{ color: palette.textMuted, fontSize: 14, fontFamily: Fonts.body, lineHeight: 20 }}>This event has already passed.</Text>
          </Surface>
        )}
      </View>
    </ScreenScroll>
  );
}
