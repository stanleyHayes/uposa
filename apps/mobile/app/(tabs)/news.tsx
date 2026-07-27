import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { newsApi } from '@/lib/api';
import type { News, NewsCategory } from '@/lib/types';
import { EmptyState, LoadingState, Pill, ScreenHeader, Surface, formatShortDate } from '@/components/mobile-ui';
import { FadeInUp } from '@/components/motion';

const CATEGORY_LABEL: Record<News['category'], string> = {
  ANNOUNCEMENT: 'Announcement',
  BLOG: 'Blog',
  REPORT: 'Report',
  MEETING_SUMMARY: 'Meeting',
};

type CategoryFilter = 'ALL' | NewsCategory;

const FILTER_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'BLOG', label: 'Blog' },
  { value: 'REPORT', label: 'Report' },
  { value: 'MEETING_SUMMARY', label: 'Meeting' },
];

export default function NewsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();

  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { limit: 50 };
      if (category !== 'ALL') params.category = category;
      const res = await newsApi.list(params);
      setItems(res.data.data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => (
      item.title?.toLowerCase().includes(q) ||
      item.excerpt?.toLowerCase().includes(q)
    ));
  }, [items, query]);

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
      data={filtered}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListHeaderComponent={
        <View>
          <ScreenHeader
            palette={palette}
            eyebrow="Dispatches"
            title="News"
            description="Announcements, reports, stories, and meeting summaries from the association."
            icon="newspaper-outline"
          />
          <Surface palette={palette} style={{ paddingHorizontal: 12, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Ionicons name="search" size={18} color={palette.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search news"
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
              <Pressable key={option.value} onPress={() => setCategory(option.value)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
                <Pill palette={palette} active={category === option.value}>{option.label}</Pill>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        <EmptyState palette={palette} icon="newspaper-outline" title="No news found" description="Published dispatches will appear here." />
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item, index }) => {
        const row = (
          <Pressable onPress={() => router.push(`/news/${item.slug}`)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
            <Surface palette={palette} style={{ overflow: 'hidden' }}>
              {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 162 }} resizeMode="cover" /> : null}
              <View style={{ padding: 14, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Pill palette={palette} tone="gold">{CATEGORY_LABEL[item.category]}</Pill>
                  <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.bodyMedium }}>
                    {formatShortDate(item.publishedAt ?? item.createdAt)}
                  </Text>
                </View>
                <Text style={{ color: palette.text, fontSize: 18, fontFamily: Fonts.display, lineHeight: 23 }} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.excerpt ? (
                  <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19 }} numberOfLines={3}>
                    {item.excerpt}
                  </Text>
                ) : null}
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
