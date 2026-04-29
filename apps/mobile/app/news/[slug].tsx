import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

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

export default function NewsDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [item, setItem] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await newsApi.getBySlug(slug);
      setItem(res.data.data ?? null);
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

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

  if (!item) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.textMuted }}>Article not found.</Text>
      </View>
    );
  }

  const date = new Date(item.publishedAt ?? item.createdAt);

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.scroll}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cover} resizeMode="cover" />
      ) : null}

      <View style={styles.body}>
        <View style={[styles.chip, { backgroundColor: Brand.cream, borderColor: palette.border }]}>
          <Text style={[styles.chipText, { color: Brand.navy }]}>
            {CATEGORY_LABEL[item.category]}
          </Text>
        </View>

        <Text style={[styles.title, { color: palette.text }]}>{item.title}</Text>

        <Text style={[styles.meta, { color: palette.textMuted }]}>
          {item.authorName ? `${item.authorName} · ` : ''}
          {date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>

        {item.excerpt ? (
          <Text style={[styles.excerpt, { color: palette.text }]}>{item.excerpt}</Text>
        ) : null}

        <Text style={[styles.content, { color: palette.text }]}>{item.content}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cover: { width: '100%', height: 220 },
  body: { padding: 16, gap: 10 },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  chipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  title: { fontSize: 24, fontWeight: '800', lineHeight: 30 },
  meta: { fontSize: 12 },
  excerpt: { fontSize: 16, lineHeight: 24, fontStyle: 'italic', marginTop: 6 },
  content: { fontSize: 15, lineHeight: 24, marginTop: 8 },
});
