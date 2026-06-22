import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { eventsApi } from '@/lib/api';
import type { Event } from '@/lib/types';
import { EmptyState, LoadingState, Pill, ScreenHeader, Surface, formatDateTime } from '@/components/mobile-ui';

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

  if (loading) return <LoadingState palette={palette} title="Events" />;

  return (
    <FlatList
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={events}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListHeaderComponent={
        <ScreenHeader
          palette={palette}
          eyebrow="Calendar"
          title="Events"
          description="Gatherings, meetings, homecomings, and school-facing activities."
          icon="calendar-outline"
        />
      }
      ListEmptyComponent={
        <EmptyState palette={palette} icon="calendar-outline" title="No events yet" description="Published events and RSVP opportunities will appear here." />
      }
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item }) => {
        const date = new Date(item.date);
        const isPast = item.status === 'PAST' || date < new Date();
        return (
          <Pressable onPress={() => router.push(`/events/${item.slug}`)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
            <Surface palette={palette} style={{ padding: 14, flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 58, minHeight: 68, backgroundColor: Brand.gold, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: Brand.navy, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 }}>
                  {date.toLocaleString('en', { month: 'short' }).toUpperCase()}
                </Text>
                <Text style={{ color: Brand.navy, fontSize: 24, fontWeight: '900' }}>{date.getDate()}</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Text style={{ flex: 1, color: palette.text, fontSize: 16, fontWeight: '900' }} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.isFeatured ? <Pill palette={palette} tone="gold">Featured</Pill> : null}
                </View>
                <Text style={{ color: palette.textMuted, fontSize: 12, lineHeight: 17 }}>
                  {formatDateTime(item.date)}
                  {item.location ? ` · ${item.location}` : ''}
                </Text>
                <Pill palette={palette} active={!isPast} tone={isPast ? 'muted' : 'gold'}>
                  {isPast ? 'Past' : item.status}
                </Pill>
              </View>
            </Surface>
          </Pressable>
        );
      }}
    />
  );
}
