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
import { projectsApi } from '@/lib/api';
import type { Project } from '@/lib/types';

export default function ProjectsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await projectsApi.list({ limit: 50 });
      setProjects(res.data.data ?? []);
    } catch {
      setProjects([]);
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
      data={projects}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListEmptyComponent={
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Ionicons name="construct-outline" size={36} color={palette.textMuted} />
          <Text style={{ color: palette.textMuted }}>No projects yet.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const pct = item.goalAmount > 0 ? Math.min(100, Math.round((item.raisedAmount / item.goalAmount) * 100)) : 0;
        return (
          <Pressable
            onPress={() => router.push(`/projects/${item.slug}`)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.cover} resizeMode="cover" />
            ) : null}
            <View style={styles.body}>
              <View style={styles.headerRow}>
                <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <View
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: item.status === 'ONGOING' ? Brand.gold : palette.surfaceMuted,
                    },
                  ]}
                >
                  <Text style={[styles.statusText, { color: Brand.navy }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={[styles.desc, { color: palette.textMuted }]} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: palette.surfaceMuted }]}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={[styles.progressLabel, { color: palette.textMuted }]}>
                GHS {item.raisedAmount.toLocaleString()} of GHS {item.goalAmount.toLocaleString()} ({pct}%)
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  cover: { width: '100%', height: 150 },
  body: { padding: 14, gap: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '700' },
  statusChip: { paddingHorizontal: 8, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  desc: { fontSize: 13, lineHeight: 18 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', backgroundColor: Brand.gold },
  progressLabel: { fontSize: 11, marginTop: 4 },
  empty: {
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
});
