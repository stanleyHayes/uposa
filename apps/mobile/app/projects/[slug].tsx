import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { projectsApi } from '@/lib/api';
import type { Project } from '@/lib/types';

export default function ProjectDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await projectsApi.getBySlug(slug);
      setProject(res.data.data ?? null);
    } catch {
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.textMuted }}>Project not found.</Text>
      </View>
    );
  }

  const pct = project.goalAmount > 0 ? Math.min(100, Math.round((project.raisedAmount / project.goalAmount) * 100)) : 0;

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.scroll}
    >
      {project.imageUrl ? (
        <Image source={{ uri: project.imageUrl }} style={styles.cover} resizeMode="cover" />
      ) : null}

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: palette.text }]}>{project.title}</Text>
          <View
            style={[
              styles.statusChip,
              { backgroundColor: project.status === 'ONGOING' ? Brand.gold : palette.surfaceMuted },
            ]}
          >
            <Text style={[styles.statusText, { color: Brand.navy }]}>{project.status}</Text>
          </View>
        </View>

        <View style={[styles.progressCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={[styles.progressTrack, { backgroundColor: palette.surfaceMuted }]}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.progressRow}>
            <Text style={[styles.raised, { color: palette.text }]}>
              GHS {project.raisedAmount.toLocaleString()}
            </Text>
            <Text style={[styles.goal, { color: palette.textMuted }]}>
              of GHS {project.goalAmount.toLocaleString()} ({pct}%)
            </Text>
          </View>
        </View>

        <Text style={[styles.description, { color: palette.text }]}>{project.description}</Text>
        {project.content ? (
          <Text style={[styles.content, { color: palette.text }]}>{project.content}</Text>
        ) : null}

        {project.milestones && project.milestones.length > 0 ? (
          <>
            <Text style={[styles.sectionHeading, { color: palette.text }]}>Milestones</Text>
            {project.milestones.map((m, idx) => (
              <View
                key={`${m.title}-${idx}`}
                style={[styles.milestone, { backgroundColor: palette.surface, borderColor: palette.border }]}
              >
                <Ionicons
                  name={m.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={m.completed ? Brand.gold : palette.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.milestoneTitle, { color: palette.text }]}>{m.title}</Text>
                  {m.description ? (
                    <Text style={[styles.milestoneDesc, { color: palette.textMuted }]}>{m.description}</Text>
                  ) : null}
                  {m.date ? (
                    <Text style={[styles.milestoneDate, { color: palette.textMuted }]}>
                      {new Date(m.date).toLocaleDateString()}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 40 },
  cover: { width: '100%', height: 220 },
  body: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 22, fontWeight: '800' },
  statusChip: { paddingHorizontal: 8, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  progressCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  progressTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Brand.gold },
  progressRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 },
  raised: { fontSize: 18, fontWeight: '800' },
  goal: { fontSize: 12 },
  description: { fontSize: 14, lineHeight: 22 },
  content: { fontSize: 14, lineHeight: 22, marginTop: 4 },
  sectionHeading: { fontSize: 16, fontWeight: '700', marginTop: 14 },
  milestone: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  milestoneTitle: { fontSize: 14, fontWeight: '700' },
  milestoneDesc: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  milestoneDate: { fontSize: 11, marginTop: 4 },
});
