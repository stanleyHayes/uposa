import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { pollsApi } from '@/lib/api';
import type { Poll } from '@/lib/types';

export default function PollsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await pollsApi.list({ limit: 50 });
      setPolls(res.data.data ?? []);
    } catch {
      setPolls([]);
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

  const onVote = async (poll: Poll, optionIds: number[]) => {
    try {
      await pollsApi.vote(poll.id, optionIds);
      Alert.alert('Vote recorded', 'Thanks for participating.');
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not record vote.';
      Alert.alert('Vote failed', msg);
    }
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
      data={polls}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListEmptyComponent={
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Ionicons name="bar-chart-outline" size={36} color={palette.textMuted} />
          <Text style={{ color: palette.textMuted }}>No active polls.</Text>
        </View>
      }
      renderItem={({ item }) => <PollCard poll={item} palette={palette} onVote={onVote} />}
    />
  );
}

function PollCard({
  poll,
  palette,
  onVote,
}: {
  poll: Poll;
  palette: Palette;
  onVote: (poll: Poll, optionIds: number[]) => void;
}) {
  const closed = poll.status === 'CLOSED';
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.question, { color: palette.text }]}>{poll.question}</Text>
        <View
          style={[
            styles.statusChip,
            { backgroundColor: closed ? palette.surfaceMuted : Brand.gold },
          ]}
        >
          <Text style={[styles.statusText, { color: Brand.navy }]}>
            {closed ? 'CLOSED' : 'OPEN'}
          </Text>
        </View>
      </View>
      {poll.description ? (
        <Text style={[styles.desc, { color: palette.textMuted }]}>{poll.description}</Text>
      ) : null}

      <View style={{ marginTop: 8 }}>
        {poll.options.map((opt) => {
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const showResults = poll.hasVoted || closed;
          const myVoted = poll.myVote?.includes(opt.id);
          return (
            <Pressable
              key={opt.id}
              onPress={() => !poll.hasVoted && !closed && onVote(poll, [opt.id])}
              disabled={!!poll.hasVoted || closed}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: myVoted ? Brand.gold : palette.border,
                  backgroundColor: palette.background,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              {showResults ? (
                <View
                  style={[
                    styles.optionFill,
                    { backgroundColor: myVoted ? 'rgba(212,175,55,0.25)' : 'rgba(0,27,80,0.08)', width: `${pct}%` },
                  ]}
                />
              ) : null}
              <Text style={[styles.optionText, { color: palette.text }]}>{opt.text}</Text>
              {showResults ? (
                <Text style={[styles.optionPct, { color: palette.textMuted }]}>
                  {pct}% · {opt.votes}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.totalText, { color: palette.textMuted }]}>
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        {poll.hasVoted ? ' · You voted' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  question: { flex: 1, fontSize: 16, fontWeight: '700' },
  statusChip: { paddingHorizontal: 8, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  desc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  option: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  optionFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  optionText: { fontSize: 14, fontWeight: '600', flex: 1 },
  optionPct: { fontSize: 12, fontWeight: '600' },
  totalText: { fontSize: 11, marginTop: 10 },
  empty: {
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
});
