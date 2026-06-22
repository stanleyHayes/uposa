import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { Brand, Colors, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { pollsApi } from '@/lib/api';
import type { Poll } from '@/lib/types';
import { EmptyState, LoadingState, Pill, ProgressBar, ScreenHeader, Surface } from '@/components/mobile-ui';

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

  if (loading) return <LoadingState palette={palette} title="Polls" />;

  return (
    <FlatList
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={polls}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListHeaderComponent={
        <ScreenHeader
          palette={palette}
          eyebrow="Decisions"
          title="Polls"
          description="Quick community signals and association decisions open to members."
          icon="bar-chart-outline"
        />
      }
      ListEmptyComponent={
        <EmptyState palette={palette} icon="bar-chart-outline" title="No active polls" description="Open member polls will appear here." />
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item }) => <PollCard poll={item} palette={palette} onVote={onVote} />}
    />
  );
}

function PollCard({ poll, palette, onVote }: { poll: Poll; palette: Palette; onVote: (poll: Poll, optionIds: number[]) => void }) {
  const closed = poll.status === 'CLOSED';
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
  const showResults = poll.hasVoted || closed;

  return (
    <Surface palette={palette} style={{ padding: 16, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <Text style={{ flex: 1, color: palette.text, fontSize: 17, fontWeight: '900', lineHeight: 23 }}>{poll.question}</Text>
        <Pill palette={palette} tone={closed ? 'muted' : 'gold'}>{closed ? 'Closed' : 'Open'}</Pill>
      </View>
      {poll.description ? <Text style={{ color: palette.textMuted, fontSize: 13, lineHeight: 19 }}>{poll.description}</Text> : null}

      <View style={{ gap: 9 }}>
        {poll.options.map((option) => {
          const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          const myVoted = poll.myVote?.includes(option.id);
          return (
            <Pressable
              key={option.id}
              onPress={() => !poll.hasVoted && !closed && onVote(poll, [option.id])}
              disabled={!!poll.hasVoted || closed}
              style={({ pressed }) => ({ opacity: pressed ? 0.78 : poll.hasVoted || closed ? 0.82 : 1 })}
            >
              <Surface palette={palette} tone={myVoted ? 'gold' : 'default'} style={{ padding: 12, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                  <Text style={{ flex: 1, color: myVoted ? Brand.navy : palette.text, fontSize: 14, fontWeight: '900' }}>{option.text}</Text>
                  {showResults ? <Text style={{ color: myVoted ? Brand.navy : palette.textMuted, fontSize: 12, fontWeight: '900' }}>{pct}%</Text> : null}
                </View>
                {showResults ? <ProgressBar palette={palette} percent={pct} /> : null}
              </Surface>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ color: palette.textMuted, fontSize: 11, fontWeight: '700' }}>
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}{poll.hasVoted ? ' · You voted' : ''}
      </Text>
    </Surface>
  );
}
