import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { projectsApi } from '@/lib/api';
import type { Project } from '@/lib/types';
import { EmptyState, LoadingState, Pill, ProgressBar, ScreenHeader, Surface, formatMoney } from '@/components/mobile-ui';
import { FadeInUp } from '@/components/motion';

type ProjectFilter = 'ALL' | 'ONGOING' | 'COMPLETED';

const FILTER_OPTIONS: { value: ProjectFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function ProjectsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<ProjectFilter>('ALL');

  const load = useCallback(async () => {
    try {
      const res =
        filter === 'ONGOING'
          ? await projectsApi.ongoing()
          : filter === 'COMPLETED'
            ? await projectsApi.completed()
            : await projectsApi.list({ limit: 50 });
      setProjects(res.data.data ?? []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingState palette={palette} title="Projects" />;

  return (
    <FlatList
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={projects}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListHeaderComponent={
        <View>
          <ScreenHeader
            palette={palette}
            eyebrow="School support"
            title="Projects"
            description="Infrastructure, welfare, learning resources, and school-facing initiatives."
            icon="construct-outline"
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingBottom: 12 }}
          >
            {FILTER_OPTIONS.map((option) => (
              <Pressable key={option.value} onPress={() => setFilter(option.value)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
                <Pill palette={palette} active={filter === option.value}>{option.label}</Pill>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        <EmptyState palette={palette} icon="construct-outline" title="No projects yet" description="Approved initiatives will appear here once published." />
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item, index }) => {
        const pct = item.goalAmount > 0 ? Math.min(100, Math.round((item.raisedAmount / item.goalAmount) * 100)) : 0;
        const row = (
          <Pressable onPress={() => router.push(`/projects/${item.slug}`)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
            <Surface palette={palette} style={{ overflow: 'hidden' }}>
              {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 154 }} resizeMode="cover" /> : null}
              <View style={{ padding: 14, gap: 9 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Text style={{ flex: 1, color: palette.text, fontSize: 17, fontFamily: Fonts.bodyBold, lineHeight: 23 }} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Pill palette={palette} tone={item.status === 'ONGOING' ? 'gold' : 'muted'}>{item.status}</Pill>
                </View>
                <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19 }} numberOfLines={2}>
                  {item.description}
                </Text>
                <ProgressBar palette={palette} percent={pct} />
                <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.bodyMedium }}>
                  {formatMoney(item.raisedAmount)} of {formatMoney(item.goalAmount)} · {pct}%
                </Text>
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
