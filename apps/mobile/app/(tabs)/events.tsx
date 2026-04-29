import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { eventsApi } from '@/lib/api';
import type { Event } from '@/lib/types';

export default function EventsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await eventsApi.list({ limit: 50 });
      setEvents(res.data.data ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.list}
      data={events}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListEmptyComponent={
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Ionicons name="calendar-outline" size={36} color={palette.textMuted} />
          <Text style={[styles.emptyText, { color: palette.textMuted }]}>No events to show.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const date = new Date(item.date);
        const isPast = item.status === 'PAST' || date < new Date();
        return (
          <Pressable
            onPress={() => router.push(`/events/${item.slug}`)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.dateBadge, { backgroundColor: Brand.cream, borderColor: palette.border }]}>
              <Text style={[styles.dateMonth, { color: Brand.navy }]}>
                {date.toLocaleString('en', { month: 'short' }).toUpperCase()}
              </Text>
              <Text style={[styles.dateDay, { color: Brand.navy }]}>{date.getDate()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.isFeatured ? (
                  <View style={[styles.badge, { backgroundColor: Brand.gold }]}>
                    <Text style={styles.badgeText}>FEATURED</Text>
                  </View>
                ) : null}
              </View>
              {item.location ? (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={13} color={palette.textMuted} />
                  <Text style={[styles.meta, { color: palette.textMuted }]} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
              ) : null}
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color={palette.textMuted} />
                <Text style={[styles.meta, { color: palette.textMuted }]}>
                  {date.toLocaleString('en', {
                    weekday: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {isPast ? (
                <Text style={[styles.tag, { color: palette.textMuted }]}>Past event</Text>
              ) : null}
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  dateBadge: {
    width: 56,
    height: 60,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dateMonth: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  dateDay: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '700' },
  badge: { paddingHorizontal: 8, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, fontWeight: '800', color: Brand.navy, letterSpacing: 0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  meta: { fontSize: 12 },
  tag: { fontSize: 11, marginTop: 6, fontStyle: 'italic' },
  empty: {
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: { fontSize: 14 },
});
