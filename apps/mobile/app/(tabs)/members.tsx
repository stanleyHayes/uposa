import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { membersApi } from '@/lib/api';
import type { Member } from '@/lib/types';
import { AvatarMark, EmptyState, LoadingState, Pill, ScreenHeader, Surface } from '@/components/mobile-ui';

export default function MembersScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await membersApi.directory({ limit: 100 });
      setMembers(res.data.data ?? []);
    } catch {
      setMembers([]);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((member) => (
      member.fullName?.toLowerCase().includes(q) ||
      member.occupation?.toLowerCase().includes(q) ||
      member.organization?.toLowerCase().includes(q) ||
      String(member.yearGroup ?? '').includes(q)
    ));
  }, [members, query]);

  if (loading) return <LoadingState palette={palette} title="Directory" />;

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
            eyebrow="Directory"
            title="Members"
            description="Find classmates, year groups, mentors, executives, and professional contacts."
            icon="people-outline"
          />
          <Surface palette={palette} style={{ paddingHorizontal: 12, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Ionicons name="search" size={18} color={palette.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name, work, or year group"
              placeholderTextColor={palette.textMuted}
              style={{ flex: 1, color: palette.text, fontSize: 15, minHeight: 46 }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Surface>
        </View>
      }
      ListEmptyComponent={
        <EmptyState palette={palette} icon="people-outline" title="No members found" description="Try another name, occupation, organization, or year group." />
      }
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/members/${item.id}`)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
          <Surface palette={palette} style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <AvatarMark palette={palette} name={item.fullName} photoUrl={item.photoUrl} />
            <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
              <Text style={{ color: palette.text, fontSize: 16, fontWeight: '900' }} numberOfLines={1}>
                {item.fullName}
              </Text>
              <Text style={{ color: palette.textMuted, fontSize: 12 }} numberOfLines={1}>
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
      )}
    />
  );
}
