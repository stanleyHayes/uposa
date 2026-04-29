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
import { jobsApi } from '@/lib/api';
import type { Job } from '@/lib/types';

const TYPE_LABEL: Record<Job['jobType'], string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  VOLUNTEER: 'Volunteer',
  INTERNSHIP: 'Internship',
};

export default function JobsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await jobsApi.list({ limit: 50 });
      setJobs(res.data.data ?? []);
    } catch {
      setJobs([]);
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
      data={jobs}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListEmptyComponent={
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Ionicons name="briefcase-outline" size={36} color={palette.textMuted} />
          <Text style={{ color: palette.textMuted }}>No jobs posted right now.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/jobs/${item.id}`)}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.company, { color: Brand.navy }]}>{item.company}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.chip, { backgroundColor: Brand.cream, borderColor: palette.border }]}>
              <Text style={[styles.chipText, { color: Brand.navy }]}>{TYPE_LABEL[item.jobType]}</Text>
            </View>
            {item.location ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={13} color={palette.textMuted} />
                <Text style={[styles.metaText, { color: palette.textMuted }]} numberOfLines={1}>
                  {item.location}
                </Text>
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
    gap: 4,
  },
  title: { fontSize: 16, fontWeight: '700' },
  company: { fontSize: 13, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  chip: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 10, fontWeight: '700' },
  empty: {
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
});
