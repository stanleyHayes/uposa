import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/auth-store';
import { duesApi, eventsApi, newsApi } from '@/lib/api';
import type { Event, News } from '@/lib/types';

interface DuesSummary {
  totalDues: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [dues, setDues] = useState<DuesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [eventsRes, newsRes, duesRes] = await Promise.allSettled([
        eventsApi.upcoming(),
        newsApi.list({ limit: 3 }),
        duesApi.summary(),
      ]);

      if (eventsRes.status === 'fulfilled') {
        setEvents(eventsRes.value.data.data?.slice(0, 3) ?? []);
      }
      if (newsRes.status === 'fulfilled') {
        setNews(newsRes.value.data.data ?? []);
      }
      if (duesRes.status === 'fulfilled') {
        setDues(duesRes.value.data.data ?? null);
      }
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

  const firstName = user?.fullName?.split(' ')[0] ?? 'Alum';

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
    >
      <View style={styles.greetingBlock}>
        <Text style={[styles.greeting, { color: palette.textMuted }]}>Welcome back,</Text>
        <Text style={[styles.greetingName, { color: palette.text }]}>{firstName}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={palette.tint} style={{ marginTop: 24 }} />
      ) : (
        <>
          <View style={[styles.heroCard, { backgroundColor: Brand.navy }]}>
            <Text style={[styles.heroLabel]}>My Dues</Text>
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.heroAmount}>
                  GHS {dues?.totalPending?.toLocaleString() ?? '0'}
                </Text>
                <Text style={styles.heroSub}>Pending balance</Text>
              </View>
              <Pressable
                onPress={() => router.push('/(tabs)/profile')}
                style={[styles.heroAction, { backgroundColor: Brand.gold }]}
              >
                <Text style={styles.heroActionText}>Pay</Text>
              </Pressable>
            </View>
            <View style={[styles.heroDivider]} />
            <View style={styles.heroStats}>
              <Stat label="Paid" value={`GHS ${dues?.totalPaid?.toLocaleString() ?? '0'}`} />
              <Stat label="Overdue" value={`GHS ${dues?.totalOverdue?.toLocaleString() ?? '0'}`} />
            </View>
          </View>

          <SectionHeader title="Upcoming events" onSeeAll={() => router.push('/(tabs)/events')} palette={palette} />
          {events.length === 0 ? (
            <EmptyHint palette={palette} text="No upcoming events yet." />
          ) : (
            events.map((e) => <EventRow key={e.id} event={e} palette={palette} />)
          )}

          <SectionHeader title="Latest news" onSeeAll={() => router.push('/(tabs)/news')} palette={palette} />
          {news.length === 0 ? (
            <EmptyHint palette={palette} text="No news posts yet." />
          ) : (
            news.map((n) => <NewsRow key={n.id} item={n} palette={palette} />)
          )}
        </>
      )}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  onSeeAll,
  palette,
}: {
  title: string;
  onSeeAll: () => void;
  palette: Palette;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
      <Pressable onPress={onSeeAll}>
        <Text style={[styles.sectionLink, { color: palette.tint }]}>See all</Text>
      </Pressable>
    </View>
  );
}

function EventRow({ event, palette }: { event: Event; palette: Palette }) {
  const date = new Date(event.date);
  return (
    <View style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={[styles.dateBadge, { backgroundColor: Brand.cream, borderColor: palette.border }]}>
        <Text style={[styles.dateMonth, { color: Brand.navy }]}>
          {date.toLocaleString('en', { month: 'short' }).toUpperCase()}
        </Text>
        <Text style={[styles.dateDay, { color: Brand.navy }]}>{date.getDate()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={2}>
          {event.title}
        </Text>
        {event.location ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={palette.textMuted} />
            <Text style={[styles.metaText, { color: palette.textMuted }]} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function NewsRow({ item, palette }: { item: News; palette: Palette }) {
  return (
    <View style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={[styles.newsDot, { backgroundColor: Brand.gold }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.excerpt ? (
          <Text style={[styles.metaText, { color: palette.textMuted }]} numberOfLines={2}>
            {item.excerpt}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function EmptyHint({ palette, text }: { palette: Palette; text: string }) {
  return (
    <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Text style={{ color: palette.textMuted }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  greetingBlock: { marginBottom: 16 },
  greeting: { fontSize: 14 },
  greetingName: { fontSize: 26, fontWeight: '700', marginTop: 2 },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    gap: 8,
    marginBottom: 8,
  },
  heroLabel: { color: Brand.gold, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroAmount: { color: Brand.cream, fontSize: 28, fontWeight: '800' },
  heroSub: { color: Brand.cream, opacity: 0.8, fontSize: 12 },
  heroAction: {
    paddingHorizontal: 18,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionText: { color: Brand.navy, fontWeight: '700' },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,248,220,0.2)', marginVertical: 14 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { color: Brand.cream, opacity: 0.7, fontSize: 12 },
  statValue: { color: Brand.cream, fontSize: 15, fontWeight: '700', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionLink: { fontSize: 13, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  dateBadge: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dateMonth: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  dateDay: { fontSize: 18, fontWeight: '800' },
  newsDot: { width: 8, height: 8, borderRadius: 4 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { fontSize: 12 },
  empty: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
});
