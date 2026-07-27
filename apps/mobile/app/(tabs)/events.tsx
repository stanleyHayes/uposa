import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, Fonts, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { eventsApi } from '@/lib/api';
import type { Event } from '@/lib/types';
import { EmptyState, LoadingState, Pill, ScreenHeader, Surface, formatDateTime } from '@/components/mobile-ui';
import { FadeInUp } from '@/components/motion';

type EventFilter = 'ALL' | 'UPCOMING' | 'PAST';

const FILTER_OPTIONS: { value: EventFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'PAST', label: 'Past' },
];

export default function EventsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<EventFilter>('ALL');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const res =
        filter === 'UPCOMING'
          ? await eventsApi.upcoming()
          : filter === 'PAST'
            ? await eventsApi.past()
            : await eventsApi.list({ limit: 50 });
      setEvents(res.data.data ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((event) => (
      event.title?.toLowerCase().includes(q) ||
      event.location?.toLowerCase().includes(q)
    ));
  }, [events, query]);

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
      data={filtered}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListHeaderComponent={
        <View>
          <ScreenHeader
            palette={palette}
            eyebrow="Calendar"
            title="Events"
            description="Gatherings, meetings, homecomings, and school-facing activities."
            icon="calendar-outline"
          />
          <Surface palette={palette} style={{ paddingHorizontal: 12, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Ionicons name="search" size={18} color={palette.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by title or location"
              placeholderTextColor={palette.textMuted}
              style={{ flex: 1, color: palette.text, fontSize: 15, fontFamily: Fonts.body, minHeight: 46 }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Surface>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingBottom: 12 }}
          >
            {FILTER_OPTIONS.map((option) => (
              <Pressable key={option.value} onPress={() => setFilter(option.value)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
                <Pill palette={palette} active={filter === option.value}>{option.label}</Pill>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        <EmptyState palette={palette} icon="calendar-outline" title="No events found" description="Published events and RSVP opportunities will appear here." />
      }
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item, index }) => {
        const date = new Date(item.date);
        const isPast = item.status === 'PAST' || date < new Date();
        const row = (
          <Pressable onPress={() => router.push(`/events/${item.slug}`)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
            <Surface palette={palette} style={{ padding: 14, flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 58, minHeight: 68, backgroundColor: Brand.gold, alignItems: 'center', justifyContent: 'center', ...Radii.tile }}>
                <Text style={{ color: Brand.navy, fontSize: 11, fontFamily: Fonts.statusBold, letterSpacing: 0.8 }}>
                  {date.toLocaleString('en', { month: 'short' }).toUpperCase()}
                </Text>
                <Text style={{ color: Brand.navy, fontSize: 24, fontFamily: Fonts.displayHeavy }}>{date.getDate()}</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Text style={{ flex: 1, color: palette.text, fontSize: 16, fontFamily: Fonts.bodyBold }} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.isFeatured ? <Pill palette={palette} tone="gold">Featured</Pill> : null}
                </View>
                <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body, lineHeight: 17 }}>
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
        return index < 8 ? (
          <FadeInUp delay={Math.min(index, 7) * 40} distance={10}>{row}</FadeInUp>
        ) : (
          row
        );
      }}
    />
  );
}
