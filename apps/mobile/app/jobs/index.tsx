import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { jobsApi } from '@/lib/api';
import type { Job } from '@/lib/types';
import { EmptyState, LoadingState, Pill, ScreenHeader, Surface, formatShortDate } from '@/components/mobile-ui';
import { FadeInUp } from '@/components/motion';

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

  if (loading) return <LoadingState palette={palette} title="Jobs" />;

  return (
    <FlatList
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={jobs}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListHeaderComponent={
        <ScreenHeader
          palette={palette}
          eyebrow="Careers"
          title="Jobs board"
          description="Opportunities from alumni, partners, and the wider school network."
          icon="briefcase-outline"
        />
      }
      ListEmptyComponent={
        <EmptyState palette={palette} icon="briefcase-outline" title="No jobs posted" description="Approved opportunities will appear here once shared." />
      }
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item, index }) => {
        const row = (
          <Pressable onPress={() => router.push(`/jobs/${item.id}`)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
            <Surface palette={palette} style={{ padding: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Pill palette={palette} tone="gold">{TYPE_LABEL[item.jobType]}</Pill>
                {item.location ? <Pill palette={palette}>{item.location}</Pill> : null}
              </View>
              <Text style={{ color: palette.text, fontSize: 17, fontFamily: Fonts.bodyBold, lineHeight: 23 }} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.bodySemiBold }}>{item.company}</Text>
              <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.body }}>
                Posted {formatShortDate(item.createdAt)}{item.expiresAt ? ` · Expires ${formatShortDate(item.expiresAt)}` : ''}
              </Text>
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
