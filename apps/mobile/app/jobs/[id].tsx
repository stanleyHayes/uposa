import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { jobsApi } from '@/lib/api';
import type { Job } from '@/lib/types';

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

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.textMuted }}>Job not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.body}>
        <Text style={[styles.title, { color: palette.text }]}>{job.title}</Text>
        <Text style={[styles.company, { color: Brand.navy }]}>{job.company}</Text>

        <View style={styles.metaRow}>
          <View style={[styles.chip, { backgroundColor: Brand.cream, borderColor: palette.border }]}>
            <Text style={[styles.chipText, { color: Brand.navy }]}>{TYPE_LABEL[job.jobType]}</Text>
          </View>
          {job.location ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={palette.textMuted} />
              <Text style={[styles.metaText, { color: palette.textMuted }]}>{job.location}</Text>
            </View>
          ) : null}
          {job.expiresAt ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={palette.textMuted} />
              <Text style={[styles.metaText, { color: palette.textMuted }]}>
                Expires {new Date(job.expiresAt).toLocaleDateString()}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.description, { color: palette.text }]}>{job.description}</Text>

        {job.externalUrl ? (
          <Pressable
            onPress={() => job.externalUrl && Linking.openURL(job.externalUrl)}
            style={({ pressed }) => [
              styles.linkBtn,
              { borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="open-outline" size={16} color={palette.text} />
            <Text style={[styles.linkText, { color: palette.text }]}>Open external posting</Text>
          </Pressable>
        ) : null}

        <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.formTitle, { color: palette.text }]}>Apply</Text>
          <Text style={[styles.fieldLabel, { color: palette.textMuted }]}>Cover letter (optional)</Text>
          <TextInput
            value={coverLetter}
            onChangeText={setCoverLetter}
            placeholder="Tell the poster why you're a good fit…"
            placeholderTextColor={palette.textMuted}
            multiline
            style={[
              styles.input,
              { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
            ]}
          />
          <Pressable
            onPress={onApply}
            disabled={submitting}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: Brand.navy, opacity: pressed || submitting ? 0.85 : 1 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={Brand.cream} />
            ) : (
              <Text style={styles.btnText}>Submit application</Text>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 40 },
  body: { padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  company: { fontSize: 14, fontWeight: '600' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  chip: {
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 11, fontWeight: '700' },
  description: { fontSize: 14, lineHeight: 22, marginTop: 10 },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  linkText: { fontSize: 13, fontWeight: '600' },
  formCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  btn: {
    marginTop: 12,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: Brand.cream, fontWeight: '700', fontSize: 15 },
});
