import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { jobsApi } from '@/lib/api';
import type { Job } from '@/lib/types';
import {
  DetailRow,
  EmptyState,
  Field,
  HeroPanel,
  LoadingState,
  Pill,
  PrimaryButton,
  ScreenScroll,
  Surface,
  formatShortDate,
} from '@/components/mobile-ui';

const TYPE_LABEL: Record<Job['jobType'], string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  VOLUNTEER: 'Volunteer',
  INTERNSHIP: 'Internship',
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await jobsApi.getById(id);
      setJob(res.data.data ?? null);
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onApply = async () => {
    if (!job) return;
    setSubmitting(true);
    try {
      await jobsApi.apply(job.id, { coverLetter: coverLetter.trim() || undefined });
      Alert.alert('Application sent', 'The poster will follow up if interested.');
      setCoverLetter('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not submit application.';
      Alert.alert('Apply failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState palette={palette} title="Job" />;

  if (!job) {
    return (
      <ScreenScroll palette={palette}>
        <EmptyState palette={palette} icon="briefcase-outline" title="Job not found" description="This opportunity may have expired or been removed." />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll palette={palette} keyboardShouldPersistTaps="handled">
      <HeroPanel
        palette={palette}
        eyebrow={TYPE_LABEL[job.jobType]}
        title={job.title}
        body={`${job.company}${job.location ? ` · ${job.location}` : ''}`}
        icon="briefcase-outline"
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Pill palette={palette} tone="gold">{TYPE_LABEL[job.jobType]}</Pill>
          {job.expiresAt ? <Pill palette={palette}>Expires {formatShortDate(job.expiresAt)}</Pill> : null}
        </View>
      </HeroPanel>

      <Surface palette={palette} style={{ padding: 16 }}>
        <Text style={{ color: palette.text, fontSize: 15, lineHeight: 24 }}>{job.description}</Text>
      </Surface>

      <View style={{ gap: 10, marginTop: 16 }}>
        <DetailRow palette={palette} icon="business-outline" label="Company" value={job.company} />
        {job.location ? <DetailRow palette={palette} icon="location-outline" label="Location" value={job.location} /> : null}
        {job.externalUrl ? (
          <DetailRow palette={palette} icon="open-outline" label="External post" value="Open the original job post" onPress={() => Linking.openURL(job.externalUrl!)} />
        ) : null}
      </View>

      <Surface palette={palette} style={{ padding: 16, marginTop: 18 }}>
        <Text style={{ color: palette.text, fontSize: 18, fontWeight: '900', marginBottom: 8 }}>Apply</Text>
        <Field
          palette={palette}
          label="Cover letter"
          value={coverLetter}
          onChangeText={setCoverLetter}
          placeholder="Tell the poster why you are a good fit..."
          icon="create-outline"
          multiline
        />
        <PrimaryButton label="Submit application" palette={palette} onPress={onApply} loading={submitting} icon="send-outline" />
      </Surface>
    </ScreenScroll>
  );
}
