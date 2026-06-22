import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { newsApi } from '@/lib/api';
import type { News } from '@/lib/types';
import { EmptyState, LoadingState, Pill, ScreenHeader, Surface, formatShortDate } from '@/components/mobile-ui';

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

  if (loading) return <LoadingState palette={palette} title="News" />;

  return (
    <FlatList
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListHeaderComponent={
        <ScreenHeader
          palette={palette}
          eyebrow="Dispatches"
          title="News"
          description="Announcements, reports, stories, and meeting summaries from the association."
          icon="newspaper-outline"
        />
      }
      ListEmptyComponent={
        <EmptyState palette={palette} icon="newspaper-outline" title="No news yet" description="Published dispatches will appear here." />
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/news/${item.slug}`)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
          <Surface palette={palette} style={{ overflow: 'hidden' }}>
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 162 }} resizeMode="cover" /> : null}
            <View style={{ padding: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Pill palette={palette} tone="gold">{CATEGORY_LABEL[item.category]}</Pill>
                <Text style={{ color: palette.textMuted, fontSize: 11, fontWeight: '700' }}>
                  {formatShortDate(item.publishedAt ?? item.createdAt)}
                </Text>
              </View>
              <Text style={{ color: palette.text, fontSize: 18, fontWeight: '900', lineHeight: 23 }} numberOfLines={2}>
                {item.title}
              </Text>
              {item.excerpt ? (
                <Text style={{ color: palette.textMuted, fontSize: 13, lineHeight: 19 }} numberOfLines={3}>
                  {item.excerpt}
                </Text>
              ) : null}
            </View>
          </Surface>
        </Pressable>
      )}
    />
  );
}
