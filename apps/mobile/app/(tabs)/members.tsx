import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { membersApi } from '@/lib/api';
import type { House, Member } from '@/lib/types';
import { AvatarMark, EmptyState, LoadingState, Pill, ScreenHeader, Surface } from '@/components/mobile-ui';
import { FadeInUp } from '@/components/motion';

type HouseFilter = 'ALL' | House;

const HOUSE_OPTIONS: { value: HouseFilter; label: string }[] = [
  { value: 'ALL', label: 'All houses' },
  { value: 'ACKAH', label: 'Ackah' },
  { value: 'DENSU', label: 'Densu' },
  { value: 'TANO', label: 'Tano' },
  { value: 'NKRUMAH', label: 'Nkrumah' },
  { value: 'PRA', label: 'Pra' },
  { value: 'VOLTA', label: 'Volta' },
];

export default function MembersScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [house, setHouse] = useState<HouseFilter>('ALL');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (pageToLoad: number, append = false) => {
      if (append) setLoadingMore(true);
      try {
        const params: Record<string, string | number> = { page: pageToLoad, limit: 20 };
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        const year = parseInt(yearGroup.trim(), 10);
        if (!Number.isNaN(year)) params.yearGroup = year;
        if (house !== 'ALL') params.house = house;

        const res = await membersApi.directory(params);
        const data = res.data.data ?? [];
        setMembers((prev) => (append ? [...prev, ...data] : data));
        setPage(res.data.pagination?.page ?? pageToLoad);
        setTotalPages(res.data.pagination?.totalPages ?? 1);
      } catch {
        if (!append) setMembers([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, yearGroup, house],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(1);
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (!loading && !loadingMore && page < totalPages) {
      load(page + 1, true);
    }
  };

  const hasFilters = Boolean(debouncedSearch.trim() || yearGroup.trim() || house !== 'ALL');

  if (loading) return <LoadingState palette={palette} title="Directory" />;

  return (
    <FlatList
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={members}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        <View>
          <ScreenHeader
            palette={palette}
            eyebrow="Directory"
            title="Members"
            description="Find classmates, year groups, mentors, executives, and professional contacts."
            icon="people-outline"
          />
          <Surface palette={palette} style={{ paddingHorizontal: 12, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Ionicons name="search" size={18} color={palette.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name, work, or organization"
              placeholderTextColor={palette.textMuted}
              style={{ flex: 1, color: palette.text, fontSize: 15, fontFamily: Fonts.body, minHeight: 46 }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Surface>
          <Surface palette={palette} style={{ paddingHorizontal: 12, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Ionicons name="school-outline" size={18} color={palette.textMuted} />
            <TextInput
              value={yearGroup}
              onChangeText={setYearGroup}
              placeholder="Year group, e.g. 2005"
              placeholderTextColor={palette.textMuted}
              style={{ flex: 1, color: palette.text, fontSize: 15, fontFamily: Fonts.body, minHeight: 46 }}
              keyboardType="number-pad"
              maxLength={4}
            />
          </Surface>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingBottom: 12 }}
          >
            {HOUSE_OPTIONS.map((option) => (
              <Pressable key={option.value} onPress={() => setHouse(option.value)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
                <Pill palette={palette} active={house === option.value}>{option.label}</Pill>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          palette={palette}
          icon="people-outline"
          title="No members found"
          description={hasFilters ? 'Try clearing the search and filters.' : 'Approved alumni profiles will appear here.'}
        />
      }
      ListFooterComponent={
        loadingMore ? (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <ActivityIndicator color={palette.tint} />
          </View>
        ) : null
      }
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item, index }) => {
        const row = (
          <Pressable onPress={() => router.push(`/members/${item.id}`)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
            <Surface palette={palette} style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AvatarMark palette={palette} name={item.fullName} photoUrl={item.photoUrl} />
              <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
                <Text style={{ color: palette.text, fontSize: 16, fontFamily: Fonts.bodyBold }} numberOfLines={1}>
                  {item.fullName}
                </Text>
                <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body }} numberOfLines={1}>
                  {[item.occupation, item.organization].filter(Boolean).join(' · ') || 'Alumnus'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {item.yearGroup ? <Pill palette={palette}>Class of {item.yearGroup}</Pill> : null}
                  {item.house ? <Pill palette={palette}>{item.house}</Pill> : null}
                  {item.isAvailableAsMentor ? <Pill palette={palette} tone="gold">Mentor</Pill> : null}
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color={palette.textMuted} />
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
