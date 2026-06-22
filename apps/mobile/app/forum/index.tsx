import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { forumApi } from '@/lib/api';
import type { ForumPost } from '@/lib/types';
import { EmptyState, LoadingState, Pill, ScreenHeader, Surface, formatShortDate } from '@/components/mobile-ui';

export default function ForumIndexScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await forumApi.posts({ limit: 50 });
      setPosts(res.data.data ?? []);
    } catch {
      setPosts([]);
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

  if (loading) return <LoadingState palette={palette} title="Forum" />;

  return (
    <FlatList
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={posts}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListHeaderComponent={
        <ScreenHeader
          palette={palette}
          eyebrow="Community"
          title="Forum"
          description="Questions, ideas, announcements, welfare threads, and year-group discussions."
          icon="chatbubbles-outline"
        />
      }
      ListEmptyComponent={
        <EmptyState palette={palette} icon="chatbubbles-outline" title="No discussions yet" description="New alumni threads will appear here when members start talking." />
      }
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/forum/${item.slug}`)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
          <Surface palette={palette} style={{ padding: 14, gap: 8 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Pill palette={palette} tone={item.isPinned ? 'gold' : 'muted'}>{item.isPinned ? 'Pinned' : item.category}</Pill>
              {item.isLocked ? <Pill palette={palette}>Locked</Pill> : null}
            </View>
            <Text style={{ color: palette.text, fontSize: 17, fontWeight: '900', lineHeight: 23 }} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={{ color: palette.textMuted, fontSize: 13, lineHeight: 19 }} numberOfLines={2}>
              {item.content}
            </Text>
            <Text style={{ color: palette.textMuted, fontSize: 11, fontWeight: '700' }}>
              {item.author?.fullName ?? 'Unknown'} · {formatShortDate(item.createdAt)} · {item._count?.comments ?? item.comments?.length ?? 0} replies
            </Text>
          </Surface>
        </Pressable>
      )}
    />
  );
}
