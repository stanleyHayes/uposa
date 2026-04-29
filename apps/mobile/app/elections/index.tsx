import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { electionsApi } from '@/lib/api';
import type { Election, ElectionCandidate } from '@/lib/types';

export default function ElectionsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      data={elections}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      ListEmptyComponent={
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Ionicons name="ribbon-outline" size={36} color={palette.textMuted} />
          <Text style={{ color: palette.textMuted }}>No elections at the moment.</Text>
        </View>
      }
      renderItem={({ item }) => <ElectionCard election={item} palette={palette} onVote={onVote} />}
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
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: palette.text }]}>{election.title}</Text>
          <Text style={[styles.position, { color: palette.textMuted }]}>{election.position}</Text>
        </View>
        <View
          style={[
            styles.statusChip,
            { backgroundColor: isActive ? Brand.gold : palette.surfaceMuted },
          ]}
        >
          <Text style={[styles.statusText, { color: Brand.navy }]}>{election.status}</Text>
        </View>
      </View>
      {election.description ? (
        <Text style={[styles.desc, { color: palette.textMuted }]}>{election.description}</Text>
      ) : null}

      <View style={{ marginTop: 12, gap: 10 }}>
        {election.candidates.map((c) => (
          <CandidateRow
            key={c.id}
            candidate={c}
            palette={palette}
            isMyVote={election.myVote === c.id}
            disabled={!isActive || !!election.hasVoted}
            onVote={() => onVote(election.id, c.id)}
          />
        ))}
      </View>

      <Text style={[styles.totalText, { color: palette.textMuted }]}>
        {new Date(election.startDate).toLocaleDateString()} → {new Date(election.endDate).toLocaleDateString()}
        {election.hasVoted ? ' · You voted' : ''}
      </Text>
    </View>
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
    <View
      style={[
        styles.candidate,
        { borderColor: isMyVote ? Brand.gold : palette.border, backgroundColor: palette.background },
      ]}
    >
      {candidate.photoUrl ? (
        <Image source={{ uri: candidate.photoUrl }} style={styles.candidatePhoto} />
      ) : (
        <View style={[styles.candidatePhoto, styles.candidatePhotoFallback, { backgroundColor: Brand.navy }]}>
          <Text style={[styles.candidateLetter, { color: Brand.gold }]}>
            {candidate.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.candidateName, { color: palette.text }]}>{candidate.name}</Text>
        {candidate.manifesto ? (
          <Text style={[styles.manifesto, { color: palette.textMuted }]} numberOfLines={3}>
            {candidate.manifesto}
          </Text>
        ) : null}
        {typeof candidate.votes === 'number' ? (
          <Text style={[styles.voteCount, { color: palette.textMuted }]}>
            {candidate.votes} {candidate.votes === 1 ? 'vote' : 'votes'}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onVote}
        disabled={disabled}
        style={({ pressed }) => [
          styles.voteBtn,
          {
            backgroundColor: isMyVote ? Brand.gold : Brand.navy,
            opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text style={[styles.voteBtnText, { color: isMyVote ? Brand.navy : Brand.cream }]}>
          {isMyVote ? 'Voted' : 'Vote'}
        </Text>
      </Pressable>
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
  title: { fontSize: 17, fontWeight: '800' },
  position: { fontSize: 12, marginTop: 2 },
  statusChip: { paddingHorizontal: 8, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  desc: { fontSize: 13, marginTop: 6, lineHeight: 19 },
  candidate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  candidatePhoto: { width: 44, height: 44, borderRadius: 22 },
  candidatePhotoFallback: { alignItems: 'center', justifyContent: 'center' },
  candidateLetter: { fontSize: 18, fontWeight: '800' },
  candidateName: { fontSize: 14, fontWeight: '700' },
  manifesto: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  voteCount: { fontSize: 11, marginTop: 4 },
  voteBtn: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteBtnText: { fontSize: 12, fontWeight: '700' },
  totalText: { fontSize: 11, marginTop: 12 },
  empty: {
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
});
