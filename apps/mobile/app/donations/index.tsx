import { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, Text, View } from 'react-native';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { donationsApi, paymentMethodsApi, paymentsApi, projectsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { PaymentMethod, PaymentProvider, Project } from '@/lib/types';
import {
  EmptyState,
  Field,
  HeroPanel,
  LoadingState,
  PrimaryButton,
  ProgressBar,
  ScreenScroll,
  SectionTitle,
  SkeletonBar,
  Surface,
  formatMoney,
} from '@/components/mobile-ui';

function getPreferredCurrency(method?: PaymentMethod) {
  return method?.supportedCurrencies?.find((currency) => currency === 'GHS') ?? method?.supportedCurrencies?.[0] ?? 'GHS';
}

export default function DonationsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const user = useAuthStore((s) => s.user);

  const [projects, setProjects] = useState<Project[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState<PaymentProvider | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [feePreview, setFeePreview] = useState<{ amount: number; platformFee: number; totalAmount: number; percent: number; fixed: number; enabled: boolean } | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [projectsRes, methodsRes] = await Promise.allSettled([
        projectsApi.ongoing(),
        paymentMethodsApi.list(),
      ]);
      setProjects(projectsRes.status === 'fulfilled' ? projectsRes.value.data.data ?? [] : []);
      const enabledMethods = methodsRes.status === 'fulfilled' ? methodsRes.value.data.data ?? [] : [];
      setPaymentMethods(enabledMethods);
      setProvider((current) => {
        if (current && enabledMethods.some((method) => method.provider === current)) return current;
        return enabledMethods[0]?.provider ?? '';
      });
    } catch {
      setProjects([]);
      setPaymentMethods([]);
      setProvider('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setFeePreview(null);
      return;
    }
    setFeeLoading(true);
    paymentsApi.platformFeePreview(amt)
      .then((res) => setFeePreview(res.data.data ?? null))
      .catch(() => setFeePreview(null))
      .finally(() => setFeeLoading(false));
  }, [amount]);

  useEffect(() => {
    load();
  }, [load]);

  const onDonate = async () => {
    const amt = Number(amount);
    if (!name.trim() || !email.trim() || !amt || amt <= 0) {
      Alert.alert('Missing details', 'Provide your name, email, and a positive amount.');
      return;
    }
    const selectedMethod = paymentMethods.find((method) => method.provider === provider);
    if (!provider || !selectedMethod) {
      Alert.alert('Payment unavailable', 'No online payment provider is enabled right now.');
      return;
    }
    const currency = getPreferredCurrency(selectedMethod);
    setSubmitting(true);
    try {
      const donationRes = await donationsApi.create({
        donorName: name.trim(),
        donorEmail: email.trim().toLowerCase(),
        amount: amt,
        currency,
        channel: provider,
        purpose: 'Alumni app donation',
      });
      const donation = donationRes.data.data;
      if (!donation?.id) throw new Error('Donation record was not created.');

      const res = await paymentsApi.initialize({
        provider,
        purpose: 'DONATION',
        amount: amt,
        currency,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        donationId: donation.id,
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

  if (loading) return <LoadingState palette={palette} title="Donations" />;

  const selectedMethod = paymentMethods.find((method) => method.provider === provider);
  const selectedCurrency = getPreferredCurrency(selectedMethod);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenScroll palette={palette} keyboardShouldPersistTaps="handled">
        <HeroPanel
          palette={palette}
          eyebrow="School support"
          title="Give toward visible UPOSA work."
          body="Fund infrastructure, learning resources, welfare, events, and projects that move the school forward."
          icon="heart-outline"
        />

        <SectionTitle palette={palette} title="Active projects" />
        {projects.length === 0 ? (
          <EmptyState palette={palette} icon="construct-outline" title="No active projects" description="You can still make a general donation through the form below." />
        ) : (
          <View style={{ gap: 10 }}>
            {projects.slice(0, 3).map((project) => {
              const pct = project.goalAmount > 0 ? Math.min(100, Math.round((project.raisedAmount / project.goalAmount) * 100)) : 0;
              return (
                <Surface key={project.id} palette={palette} style={{ padding: 14, gap: 8 }}>
                  <Text style={{ color: palette.text, fontSize: 15, fontWeight: '900' }} numberOfLines={2}>{project.title}</Text>
                  <ProgressBar palette={palette} percent={pct} />
                  <Text style={{ color: palette.textMuted, fontSize: 12, fontWeight: '700' }}>
                    {formatMoney(project.raisedAmount)} / {formatMoney(project.goalAmount)} · {pct}%
                  </Text>
                </Surface>
              );
            })}
          </View>
        )}

        <SectionTitle palette={palette} title="Make a donation" />
        <Surface palette={palette} style={{ padding: 16, gap: 2 }}>
          <Field palette={palette} label="Full name" value={name} onChangeText={setName} icon="person-outline" />
          <Field palette={palette} label="Email" value={email} onChangeText={setEmail} icon="mail-outline" keyboardType="email-address" />
          <Field palette={palette} label="Amount" value={amount} onChangeText={setAmount} icon="cash-outline" keyboardType="numeric" placeholder="100" />

          <Text style={{ color: palette.text, fontSize: 12, fontWeight: '900', marginBottom: 8 }}>Provider</Text>
          {paymentMethods.length === 0 ? (
            <EmptyState
              palette={palette}
              icon="card-outline"
              title="Online payment is unavailable"
              description="Ask the association desk to enable a payment provider."
            />
          ) : (
            <View style={{ gap: 10, marginBottom: 12 }}>
              {paymentMethods.map((item) => {
                const active = provider === item.provider;
                return (
                  <Pressable key={item.id} onPress={() => setProvider(item.provider)}>
                    <Surface palette={palette} tone={active ? 'gold' : 'default'} style={{ padding: 12, gap: 4 }}>
                      <Text style={{ color: active ? Brand.navy : palette.text, fontSize: 13, fontWeight: '900' }}>{item.displayName}</Text>
                      <Text style={{ color: active ? Brand.navy : palette.textMuted, fontSize: 11, fontWeight: '700' }}>
                        {item.supportedCurrencies.join(', ') || item.provider}
                      </Text>
                    </Surface>
                  </Pressable>
                );
              })}
            </View>
          )}

          {feeLoading ? (
            <Surface palette={palette} tone="muted" style={{ padding: 12, gap: 8, marginBottom: 12 }}>
              <SkeletonBar palette={palette} width="60%" />
              <SkeletonBar palette={palette} width="82%" />
            </Surface>
          ) : null}

          {feePreview && feePreview.enabled && feePreview.platformFee > 0 ? (
            <Surface palette={palette} tone="muted" style={{ padding: 12, gap: 8, marginBottom: 12 }}>
              <FeeLine palette={palette} label="Donation" value={formatMoney(feePreview.amount, selectedCurrency)} />
              <FeeLine palette={palette} label={`Platform fee (${feePreview.percent}%)`} value={formatMoney(feePreview.platformFee, selectedCurrency)} />
              <FeeLine palette={palette} label="Total to pay" value={formatMoney(feePreview.totalAmount, selectedCurrency)} strong />
            </Surface>
          ) : null}

          <PrimaryButton
            label="Continue to payment"
            palette={palette}
            onPress={onDonate}
            loading={submitting}
            disabled={paymentMethods.length === 0}
            icon="arrow-forward"
          />
        </Surface>
      </ScreenScroll>
    </KeyboardAvoidingView>
  );
}

function FeeLine({ palette, label, value, strong }: { palette: typeof Colors.light; label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <Text style={{ color: strong ? palette.text : palette.textMuted, fontSize: 13, fontWeight: strong ? '900' : '700' }}>{label}</Text>
      <Text style={{ color: strong ? Brand.gold : palette.text, fontSize: 13, fontWeight: '900' }}>{value}</Text>
    </View>
  );
}
