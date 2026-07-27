import { useCallback, useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { projectsApi } from '@/lib/api';
import type { Project } from '@/lib/types';
import {
  EmptyState,
  HeroPanel,
  LoadingState,
  Pill,
  ProgressBar,
  ScreenScroll,
  SectionTitle,
  Surface,
  formatMoney,
  formatShortDate,
} from '@/components/mobile-ui';
import { MarkdownBody } from '@/components/markdown';

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

  if (loading) return <LoadingState palette={palette} title="Project" />;

  if (!project) {
    return (
      <ScreenScroll palette={palette}>
        <EmptyState palette={palette} icon="construct-outline" title="Project not found" description="This project may have been removed or unpublished." />
      </ScreenScroll>
    );
  }

  const pct = project.goalAmount > 0 ? Math.min(100, Math.round((project.raisedAmount / project.goalAmount) * 100)) : 0;

  return (
    <ScreenScroll palette={palette} padded={false}>
      {project.imageUrl ? <Image source={{ uri: project.imageUrl }} style={{ width: '100%', height: 230 }} resizeMode="cover" /> : null}
      <View style={{ padding: 16 }}>
        <HeroPanel
          palette={palette}
          eyebrow={project.status}
          title={project.title}
          icon="construct-outline"
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Pill palette={palette} tone="gold">{pct}% funded</Pill>
            <Pill palette={palette}>{formatMoney(project.raisedAmount)} raised</Pill>
          </View>
        </HeroPanel>

        <Surface palette={palette} style={{ padding: 16, gap: 10 }}>
          <ProgressBar palette={palette} percent={pct} />
          <Text style={{ color: palette.text, fontSize: 22, fontFamily: Fonts.displayHeavy }}>{formatMoney(project.raisedAmount)}</Text>
          <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body }}>
            of {formatMoney(project.goalAmount)} target
          </Text>
        </Surface>

        {project.description ? (
          <Surface palette={palette} style={{ padding: 16, marginTop: 14 }}>
            <MarkdownBody palette={palette}>{project.description}</MarkdownBody>
          </Surface>
        ) : null}

        {project.content ? (
          <Surface palette={palette} style={{ padding: 16, marginTop: 14 }}>
            <MarkdownBody palette={palette}>{project.content}</MarkdownBody>
          </Surface>
        ) : null}

        {project.milestones && project.milestones.length > 0 ? (
          <>
            <SectionTitle palette={palette} title="Milestones" />
            <View style={{ gap: 10 }}>
              {project.milestones.map((milestone, index) => (
                <Surface key={`${milestone.title}-${index}`} palette={palette} style={{ padding: 12, flexDirection: 'row', gap: 12 }}>
                  <Pill palette={palette} tone={milestone.completed ? 'gold' : 'muted'}>{milestone.completed ? 'Done' : 'Open'}</Pill>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.text, fontSize: 14, fontFamily: Fonts.bodyBold }}>{milestone.title}</Text>
                    {milestone.description ? (
                      <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body, lineHeight: 18, marginTop: 3 }}>{milestone.description}</Text>
                    ) : null}
                    {milestone.date ? (
                      <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.body, marginTop: 5 }}>{formatShortDate(milestone.date)}</Text>
                    ) : null}
                  </View>
                </Surface>
              ))}
            </View>
          </>
        ) : null}
      </View>
    </ScreenScroll>
  );
}
