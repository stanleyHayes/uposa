import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import { newsApi } from '@/lib/api';
import type { News } from '@/lib/types';

const CATEGORY_LABEL: Record<News['category'], string> = {
  ANNOUNCEMENT: 'Announcement',
  BLOG: 'Blog',
  REPORT: 'Report',
  MEETING_SUMMARY: 'Meeting',
};

export default function NewsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();

  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await newsApi.list({ limit: 50 });
      setItems(res.data.data ?? []);
    } catch {
      setItems([]);
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
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListEmptyComponent={
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Ionicons name="newspaper-outline" size={36} color={palette.textMuted} />
          <Text style={{ color: palette.textMuted }}>No news yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/news/${item.slug}`)}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cover} resizeMode="cover" />
          ) : null}
          <View style={styles.cardBody}>
            <View style={[styles.chip, { backgroundColor: Brand.cream, borderColor: palette.border }]}>
              <Text style={[styles.chipText, { color: Brand.navy }]}>
                {CATEGORY_LABEL[item.category]}
              </Text>
            </View>
            <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            {item.excerpt ? (
              <Text style={[styles.excerpt, { color: palette.textMuted }]} numberOfLines={3}>
                {item.excerpt}
              </Text>
            ) : null}
            <Text style={[styles.meta, { color: palette.textMuted }]}>
              {item.authorName ? `${item.authorName} · ` : ''}
              {new Date(item.publishedAt ?? item.createdAt).toLocaleDateString('en', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cover: { width: '100%', height: 160 },
  cardBody: { padding: 14, gap: 8 },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  title: { fontSize: 16, fontWeight: '700' },
  excerpt: { fontSize: 13, lineHeight: 18 },
  meta: { fontSize: 11, marginTop: 4 },
  empty: {
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
});
