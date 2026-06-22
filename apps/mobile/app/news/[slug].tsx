import { useCallback, useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { newsApi } from '@/lib/api';
import type { News } from '@/lib/types';
import { EmptyState, HeroPanel, LoadingState, Pill, ScreenScroll, Surface, formatShortDate } from '@/components/mobile-ui';

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

  if (loading) return <LoadingState palette={palette} title="Article" />;

  if (!item) {
    return (
      <ScreenScroll palette={palette}>
        <EmptyState palette={palette} icon="newspaper-outline" title="Article not found" description="This dispatch may have been removed or unpublished." />
      </ScreenScroll>
    );
  }

  const date = formatShortDate(item.publishedAt ?? item.createdAt);

  return (
    <ScreenScroll palette={palette} padded={false}>
      {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 238 }} resizeMode="cover" /> : null}
      <View style={{ padding: 16, gap: 14 }}>
        <HeroPanel
          palette={palette}
          eyebrow={CATEGORY_LABEL[item.category]}
          title={item.title}
          body={item.authorName ? `${item.authorName} · ${date}` : date}
          icon="newspaper-outline"
        />
        {item.excerpt ? (
          <Surface palette={palette} tone="muted" style={{ padding: 16 }}>
            <Text style={{ color: palette.text, fontSize: 17, lineHeight: 25, fontWeight: '800' }}>{item.excerpt}</Text>
          </Surface>
        ) : null}
        <Surface palette={palette} style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Pill palette={palette} tone="gold">{CATEGORY_LABEL[item.category]}</Pill>
            <Pill palette={palette}>{date}</Pill>
          </View>
          <Text style={{ color: palette.text, fontSize: 15, lineHeight: 24 }}>{item.content}</Text>
        </Surface>
      </View>
    </ScreenScroll>
  );
}
