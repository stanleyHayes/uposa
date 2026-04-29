import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { membersApi } from '@/lib/api';
import type { Member } from '@/lib/types';

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
    return members.filter((m) => {
      return (
        m.fullName?.toLowerCase().includes(q) ||
        m.occupation?.toLowerCase().includes(q) ||
        m.organization?.toLowerCase().includes(q) ||
        String(m.yearGroup ?? '').includes(q)
      );
    });
  }, [members, query]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: palette.background }]}>
      <View style={styles.searchWrap}>
        <View style={[styles.search, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Ionicons name="search" size={16} color={palette.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search members"
            placeholderTextColor={palette.textMuted}
            style={[styles.searchInput, { color: palette.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Ionicons name="people-outline" size={36} color={palette.textMuted} />
            <Text style={{ color: palette.textMuted }}>No members found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/members/${item.id}`)}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: Brand.navy }]}>
                <Text style={[styles.avatarLetter, { color: Brand.gold }]}>
                  {item.fullName?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
                {item.fullName}
              </Text>
              <Text style={[styles.subtitle, { color: palette.textMuted }]} numberOfLines={1}>
                {[item.occupation, item.organization].filter(Boolean).join(' · ') || 'Alumnus'}
              </Text>
              <View style={styles.tagRow}>
                {item.yearGroup ? (
                  <View style={[styles.tag, { backgroundColor: Brand.cream, borderColor: palette.border }]}>
                    <Text style={[styles.tagText, { color: Brand.navy }]}>Class of {item.yearGroup}</Text>
                  </View>
                ) : null}
                {item.house ? (
                  <View style={[styles.tag, { backgroundColor: Brand.cream, borderColor: palette.border }]}>
                    <Text style={[styles.tagText, { color: Brand.navy }]}>{item.house}</Text>
                  </View>
                ) : null}
                {item.isAvailableAsMentor ? (
                  <View style={[styles.tag, { backgroundColor: Brand.gold, borderColor: Brand.gold }]}>
                    <Text style={[styles.tagText, { color: Brand.navy }]}>Mentor</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { padding: 16, paddingBottom: 8 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 20, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  empty: {
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
});
