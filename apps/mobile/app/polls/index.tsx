import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Brand, Colors, Fonts, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { pollsApi } from '@/lib/api';
import type { Poll } from '@/lib/types';
import { EmptyState, LoadingState, Pill, ProgressBar, ScreenHeader, Surface } from '@/components/mobile-ui';
import { FadeInUp } from '@/components/motion';

type PollFilter = 'ALL' | 'ACTIVE' | 'CLOSED';

const FILTER_OPTIONS: { value: PollFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function PollsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<PollFilter>('ALL');

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

  const filtered = useMemo(() => {
    if (filter === 'ALL') return polls;
    return polls.filter((poll) => poll.status === filter);
  }, [polls, filter]);

  if (loading) return <LoadingState palette={palette} title="Polls" />;

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
            eyebrow="Decisions"
            title="Polls"
            description="Quick community signals and association decisions open to members."
            icon="bar-chart-outline"
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
        <EmptyState palette={palette} icon="bar-chart-outline" title="No polls found" description="Open member polls will appear here." />
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item, index }) =>
        index < 8 ? (
          <FadeInUp delay={Math.min(index, 7) * 40} distance={10}>
            <PollCard poll={item} palette={palette} onVote={onVote} />
          </FadeInUp>
        ) : (
          <PollCard poll={item} palette={palette} onVote={onVote} />
        )
      }
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
        <Text style={{ flex: 1, color: palette.text, fontSize: 17, fontFamily: Fonts.bodyBold, lineHeight: 23 }}>{poll.question}</Text>
        <Pill palette={palette} tone={closed ? 'muted' : 'gold'}>{closed ? 'Closed' : 'Open'}</Pill>
      </View>
      {poll.description ? <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19 }}>{poll.description}</Text> : null}

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
                  <Text style={{ flex: 1, color: myVoted ? Brand.navy : palette.text, fontSize: 14, fontFamily: Fonts.bodySemiBold }}>{option.text}</Text>
                  {showResults ? <Text style={{ color: myVoted ? Brand.navy : palette.textMuted, fontSize: 12, fontFamily: Fonts.bodyBold }}>{pct}%</Text> : null}
                </View>
                {showResults ? <ProgressBar palette={palette} percent={pct} /> : null}
              </Surface>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.bodyMedium }}>
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}{poll.hasVoted ? ' · You voted' : ''}
      </Text>
    </Surface>
  );
}
