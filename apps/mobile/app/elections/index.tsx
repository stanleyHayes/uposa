import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Brand, Colors, Fonts, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { electionsApi } from '@/lib/api';
import type { Election, ElectionCandidate } from '@/lib/types';
import { AvatarMark, EmptyState, LoadingState, Pill, PrimaryButton, ScreenHeader, Surface, formatShortDate } from '@/components/mobile-ui';
import { FadeInUp } from '@/components/motion';

type ElectionFilter = 'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED';

const FILTER_OPTIONS: { value: ElectionFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function ElectionsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<ElectionFilter>('ALL');

  const load = useCallback(async () => {
    try {
      const res = await electionsApi.list({ limit: 50 });
      setElections(res.data.data ?? []);
    } catch {
      setElections([]);
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

  const onVote = async (electionId: string, candidateId: string) => {
    try {
      await electionsApi.vote(electionId, candidateId);
      Alert.alert('Vote cast', 'Thank you for participating in the election.');
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not record vote.';
      Alert.alert('Vote failed', msg);
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'ALL') return elections;
    return elections.filter((election) => election.status === filter);
  }, [elections, filter]);

  if (loading) return <LoadingState palette={palette} title="Elections" />;

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
            eyebrow="Governance"
            title="Elections"
            description="Verified member voting for association roles and decisions."
            icon="ribbon-outline"
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
        <EmptyState palette={palette} icon="ribbon-outline" title="No elections found" description="Upcoming and active elections will appear here." />
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item, index }) =>
        index < 8 ? (
          <FadeInUp delay={Math.min(index, 7) * 40} distance={10}>
            <ElectionCard election={item} palette={palette} onVote={onVote} />
          </FadeInUp>
        ) : (
          <ElectionCard election={item} palette={palette} onVote={onVote} />
        )
      }
    />
  );
}

function ElectionCard({
  election,
  palette,
  onVote,
}: {
  election: Election;
  palette: Palette;
  onVote: (electionId: string, candidateId: string) => void;
}) {
  const isActive = election.status === 'ACTIVE';

  return (
    <Surface palette={palette} style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.text, fontSize: 17, fontFamily: Fonts.bodyBold }}>{election.title}</Text>
          <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body, marginTop: 3 }}>{election.position}</Text>
        </View>
        <Pill palette={palette} tone={isActive ? 'gold' : 'muted'}>{election.status}</Pill>
      </View>
      {election.description ? <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19 }}>{election.description}</Text> : null}

      <View style={{ gap: 10 }}>
        {election.candidates.map((candidate) => (
          <CandidateRow
            key={candidate.id}
            candidate={candidate}
            palette={palette}
            isMyVote={election.myVote === candidate.id}
            disabled={!isActive || !!election.hasVoted}
            onVote={() => onVote(election.id, candidate.id)}
          />
        ))}
      </View>

      <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.bodyMedium }}>
        {formatShortDate(election.startDate)} to {formatShortDate(election.endDate)}
        {election.hasVoted ? ' · You voted' : ''}
      </Text>
    </Surface>
  );
}

function CandidateRow({
  candidate,
  palette,
  isMyVote,
  disabled,
  onVote,
}: {
  candidate: ElectionCandidate;
  palette: Palette;
  isMyVote: boolean;
  disabled: boolean;
  onVote: () => void;
}) {
  return (
    <Surface palette={palette} tone={isMyVote ? 'gold' : 'default'} style={{ padding: 12, gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <AvatarMark palette={palette} name={candidate.name} photoUrl={candidate.photoUrl} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: isMyVote ? Brand.navy : palette.text, fontSize: 15, fontFamily: Fonts.bodyBold }}>{candidate.name}</Text>
          {candidate.manifesto ? (
            <Text style={{ color: isMyVote ? Brand.navy : palette.textMuted, fontSize: 12, fontFamily: Fonts.body, lineHeight: 18, marginTop: 4 }} numberOfLines={3}>
              {candidate.manifesto}
            </Text>
          ) : null}
          {typeof candidate.votes === 'number' ? (
            <Text style={{ color: isMyVote ? Brand.navy : palette.textMuted, fontSize: 11, fontFamily: Fonts.body, marginTop: 5 }}>
              {candidate.votes} {candidate.votes === 1 ? 'vote' : 'votes'}
            </Text>
          ) : null}
        </View>
      </View>
      <PrimaryButton
        label={isMyVote ? 'Voted' : 'Vote'}
        palette={palette}
        onPress={onVote}
        disabled={disabled}
        tone={isMyVote ? 'outline' : 'navy'}
      />
    </Surface>
  );
}
