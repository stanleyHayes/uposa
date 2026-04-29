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
import { forumApi } from '@/lib/api';
import type { ForumPost } from '@/lib/types';

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
      data={posts}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListEmptyComponent={
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Ionicons name="chatbubbles-outline" size={36} color={palette.textMuted} />
          <Text style={{ color: palette.textMuted }}>No discussions yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/forum/${item.slug}`)}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={[styles.chip, { backgroundColor: Brand.cream, borderColor: palette.border }]}>
            <Text style={[styles.chipText, { color: Brand.navy }]}>{item.category}</Text>
          </View>
          <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.excerpt, { color: palette.textMuted }]} numberOfLines={2}>
            {item.content}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="person-circle-outline" size={14} color={palette.textMuted} />
            <Text style={[styles.meta, { color: palette.textMuted }]}>
              {item.author?.fullName ?? 'Unknown'}
            </Text>
            <View style={{ width: 12 }} />
            <Ionicons name="chatbox-outline" size={14} color={palette.textMuted} />
            <Text style={[styles.meta, { color: palette.textMuted }]}>
              {item._count?.comments ?? item.comments?.length ?? 0}
            </Text>
            {item.isPinned ? (
              <View style={[styles.pinned, { backgroundColor: Brand.gold }]}>
                <Text style={styles.pinnedText}>PINNED</Text>
              </View>
            ) : null}
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
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  title: { fontSize: 16, fontWeight: '700' },
  excerpt: { fontSize: 13, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  meta: { fontSize: 12 },
  pinned: { marginLeft: 'auto', paddingHorizontal: 8, height: 18, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  pinnedText: { fontSize: 9, fontWeight: '800', color: Brand.navy, letterSpacing: 0.5 },
  empty: {
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
});
