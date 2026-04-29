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
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { paymentsApi, projectsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { Project } from '@/lib/types';

const PROVIDERS = ['PAYSTACK', 'STRIPE'] as const;

export default function DonationsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const user = useAuthStore((s) => s.user);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>('PAYSTACK');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await projectsApi.ongoing();
      setProjects(res.data.data ?? []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onDonate = async () => {
    const amt = Number(amount);
    if (!name.trim() || !email.trim() || !amt || amt <= 0) {
      Alert.alert('Missing details', 'Provide your name, email, and a positive amount.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await paymentsApi.initialize({
        provider,
        purpose: 'DONATION',
        amount: amt,
        currency: provider === 'PAYSTACK' ? 'GHS' : 'USD',
        email: email.trim().toLowerCase(),
        name: name.trim(),
      });
      const url = res.data.data?.authorizationUrl;
      if (url) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No payment URL returned.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not initialize payment.';
      Alert.alert('Donation failed', msg);
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

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.heroCard, { backgroundColor: Brand.navy }]}>
        <Ionicons name="heart" size={28} color={Brand.gold} />
        <Text style={styles.heroTitle}>Support UPOSA</Text>
        <Text style={styles.heroBody}>
          Your contribution funds scholarships, infrastructure, and community impact projects.
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.text }]}>Ongoing projects</Text>
      {projects.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={{ color: palette.textMuted }}>No ongoing projects right now.</Text>
        </View>
      ) : (
        projects.map((p) => {
          const pct = p.goalAmount > 0 ? Math.min(100, Math.round((p.raisedAmount / p.goalAmount) * 100)) : 0;
          return (
            <View
              key={p.id}
              style={[styles.projectCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
            >
              <Text style={[styles.projectTitle, { color: palette.text }]} numberOfLines={2}>
                {p.title}
              </Text>
              <Text style={[styles.projectDesc, { color: palette.textMuted }]} numberOfLines={2}>
                {p.description}
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: palette.surfaceMuted }]}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={[styles.progressLabel, { color: palette.textMuted }]}>
                GHS {p.raisedAmount.toLocaleString()} / GHS {p.goalAmount.toLocaleString()} ({pct}%)
              </Text>
            </View>
          );
        })
      )}

      <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 18 }]}>Make a donation</Text>
      <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.label, { color: palette.textMuted }]}>Full name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholderTextColor={palette.textMuted}
          style={[
            styles.input,
            { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
          ]}
        />

        <Text style={[styles.label, { color: palette.textMuted, marginTop: 10 }]}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholderTextColor={palette.textMuted}
          style={[
            styles.input,
            { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
          ]}
        />

        <Text style={[styles.label, { color: palette.textMuted, marginTop: 10 }]}>Amount</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="100"
          placeholderTextColor={palette.textMuted}
          style={[
            styles.input,
            { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
          ]}
        />

        <Text style={[styles.label, { color: palette.textMuted, marginTop: 10 }]}>Provider</Text>
        <View style={styles.providerRow}>
          {PROVIDERS.map((p) => {
            const active = provider === p;
            return (
              <Pressable
                key={p}
                onPress={() => setProvider(p)}
                style={({ pressed }) => [
                  styles.providerBtn,
                  {
                    borderColor: active ? Brand.gold : palette.border,
                    backgroundColor: active ? Brand.cream : palette.background,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.providerText, { color: Brand.navy, fontWeight: active ? '800' : '600' }]}>
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={onDonate}
          disabled={submitting}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: Brand.navy, opacity: pressed || submitting ? 0.85 : 1 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={Brand.cream} />
          ) : (
            <Text style={styles.btnText}>Continue to payment</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  heroCard: {
    borderRadius: 18,
    padding: 18,
    gap: 6,
    marginBottom: 18,
  },
  heroTitle: { color: Brand.cream, fontSize: 20, fontWeight: '800' },
  heroBody: { color: Brand.cream, opacity: 0.85, fontSize: 13, lineHeight: 19 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  empty: { padding: 18, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  projectCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 6,
  },
  projectTitle: { fontSize: 15, fontWeight: '700' },
  projectDesc: { fontSize: 12, lineHeight: 17 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 6 },
  progressFill: { height: '100%', backgroundColor: Brand.gold },
  progressLabel: { fontSize: 11, marginTop: 2 },
  formCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  providerRow: { flexDirection: 'row', gap: 8 },
  providerBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerText: { fontSize: 13 },
  btn: {
    marginTop: 18,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: Brand.cream, fontWeight: '700', fontSize: 15 },
});
