import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, KeyboardAvoidingView, Linking, Platform, Pressable, Text, View } from 'react-native';

import { Brand, Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { donationsApi, paymentMethodsApi, paymentsApi, projectsApi, publicApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { Donation, DonationChannel, PaymentMethod, Project, SiteConfig } from '@/lib/types';
import {
  EmptyState,
  Field,
  HeroPanel,
  LoadingState,
  Pill,
  PrimaryButton,
  ProgressBar,
  ScreenScroll,
  SectionTitle,
  SkeletonBar,
  Surface,
  formatMoney,
  formatShortDate,
} from '@/components/mobile-ui';
import { FadeInUp } from '@/components/motion';

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];
const MANUAL_CHANNELS: DonationChannel[] = ['MOMO', 'BANK', 'CASH', 'OTHER'];
const ONLINE_PROVIDERS: DonationChannel[] = ['PAYSTACK', 'STRIPE', 'CRYPTO'];

function getPreferredCurrency(method?: PaymentMethod) {
  return method?.supportedCurrencies?.find((currency) => currency === 'GHS') ?? method?.supportedCurrencies?.[0] ?? 'GHS';
}

export default function DonationsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const user = useAuthStore((s) => s.user);

  const [projects, setProjects] = useState<Project[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [amount, setAmount] = useState('');
  const [channel, setChannel] = useState<DonationChannel | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [feePreview, setFeePreview] = useState<{ amount: number; platformFee: number; totalAmount: number; percent: number; fixed: number; enabled: boolean } | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [pendingReference, setPendingReference] = useState<string | null>(null);

  const isOnlineChannel = ONLINE_PROVIDERS.includes(channel as DonationChannel);

  const load = useCallback(async () => {
    try {
      const [projectsRes, methodsRes, siteRes, donationsRes] = await Promise.allSettled([
        projectsApi.ongoing(),
        paymentMethodsApi.list(),
        publicApi.siteData(),
        donationsApi.my(),
      ]);
      setProjects(projectsRes.status === 'fulfilled' ? projectsRes.value.data.data ?? [] : []);
      setSiteConfig(siteRes.status === 'fulfilled' ? siteRes.value.data.data?.config ?? null : null);
      setDonations(donationsRes.status === 'fulfilled' ? donationsRes.value.data.data ?? [] : []);
      const enabledMethods = methodsRes.status === 'fulfilled' ? methodsRes.value.data.data ?? [] : [];
      setPaymentMethods(enabledMethods);
      setChannel((current) => {
        if (current && (MANUAL_CHANNELS.includes(current) || enabledMethods.some((method) => method.provider === current))) return current;
        return enabledMethods[0]?.provider ?? 'MOMO';
      });
    } catch {
      setProjects([]);
      setPaymentMethods([]);
      setChannel('MOMO');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const amt = Number(amount);
    if (!isOnlineChannel || !amt || amt <= 0) {
      setFeePreview(null);
      return;
    }
    setFeeLoading(true);
    paymentsApi.platformFeePreview(amt)
      .then((res) => setFeePreview(res.data.data ?? null))
      .catch(() => setFeePreview(null))
      .finally(() => setFeeLoading(false));
  }, [amount, isOnlineChannel]);

  useEffect(() => {
    load();
  }, [load]);

  const verifyPayment = useCallback(
    async (reference: string) => {
      try {
        const res = await paymentsApi.status(reference);
        const status = (res.data.data as { status?: string } | undefined)?.status;
        await load();
        if (status === 'SUCCESS') {
          setPendingReference(null);
          Alert.alert('Donation confirmed', 'Your donation payment was confirmed. Thank you for giving.');
        } else if (status === 'FAILED' || status === 'CANCELLED') {
          setPendingReference(null);
          Alert.alert('Payment not completed', 'The donation payment did not go through. You can try again.');
        }
      } catch {
        // Keep the reference; verification retries on the next app activation.
      }
    },
    [load],
  );

  useEffect(() => {
    if (!pendingReference) return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') void verifyPayment(pendingReference);
    });
    return () => subscription.remove();
  }, [pendingReference, verifyPayment]);

  const onDonate = async () => {
    const amt = Number(amount);
    if (!name.trim() || !email.trim() || !amt || amt <= 0) {
      Alert.alert('Missing details', 'Provide your name, email, and a positive amount.');
      return;
    }
    if (!channel) {
      Alert.alert('Payment unavailable', 'Choose a payment channel to continue.');
      return;
    }

    setSubmitting(true);
    try {
      if (!isOnlineChannel) {
        await donationsApi.create({
          donorName: name.trim(),
          donorEmail: email.trim().toLowerCase(),
          amount: amt,
          currency: 'GHS',
          channel: channel as DonationChannel,
          purpose: 'Alumni app donation',
        });
        setAmount('');
        Alert.alert(
          'Donation recorded',
          'Your donation was recorded. It will be confirmed once the finance team verifies your manual payment.',
        );
        await load();
        return;
      }

      const selectedMethod = paymentMethods.find((method) => method.provider === channel);
      if (!selectedMethod) {
        Alert.alert('Payment unavailable', 'No online payment provider is enabled right now.');
        return;
      }
      const currency = getPreferredCurrency(selectedMethod);
      const donationRes = await donationsApi.create({
        donorName: name.trim(),
        donorEmail: email.trim().toLowerCase(),
        amount: amt,
        currency,
        channel: channel as DonationChannel,
        purpose: 'Alumni app donation',
      });
      const donation = donationRes.data.data;
      if (!donation?.id) throw new Error('Donation record was not created.');

      const res = await paymentsApi.initialize({
        provider: channel,
        purpose: 'DONATION',
        amount: amt,
        currency,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        donationId: donation.id,
      });
      const url = res.data.data?.authorizationUrl;
      const reference = res.data.data?.reference;
      if (url) {
        if (reference) setPendingReference(reference);
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No payment URL returned.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not submit the donation.';
      Alert.alert('Donation failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState palette={palette} title="Donations" />;

  const selectedMethod = paymentMethods.find((method) => method.provider === channel);
  const selectedCurrency = isOnlineChannel ? getPreferredCurrency(selectedMethod) : 'GHS';
  const momo = siteConfig?.payment?.momo;
  const bank = siteConfig?.payment?.bank;

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
                  <Text style={{ color: palette.text, fontSize: 15, fontFamily: Fonts.bodyBold }} numberOfLines={2}>{project.title}</Text>
                  <ProgressBar palette={palette} percent={pct} />
                  <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.bodyMedium }}>
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

          <Text style={{ color: palette.text, fontSize: 12, fontFamily: Fonts.bodySemiBold, marginBottom: 8 }}>Quick amounts (GHS)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {PRESET_AMOUNTS.map((preset) => (
              <Pressable key={preset} onPress={() => setAmount(String(preset))}>
                <Pill palette={palette} active={Number(amount) === preset}>{preset.toLocaleString()}</Pill>
              </Pressable>
            ))}
          </View>

          <Field palette={palette} label="Amount" value={amount} onChangeText={setAmount} icon="cash-outline" keyboardType="numeric" placeholder="100" />

          <Text style={{ color: palette.text, fontSize: 12, fontFamily: Fonts.bodySemiBold, marginBottom: 8 }}>Payment channel</Text>
          <View style={{ gap: 10, marginBottom: 12 }}>
            {paymentMethods.map((item) => {
              const active = channel === item.provider;
              return (
                <Pressable key={item.id} onPress={() => setChannel(item.provider)}>
                  <Surface palette={palette} tone={active ? 'gold' : 'default'} style={{ padding: 12, gap: 4 }}>
                    <Text style={{ color: active ? Brand.navy : palette.text, fontSize: 13, fontFamily: Fonts.statusBold }}>{item.displayName}</Text>
                    <Text style={{ color: active ? Brand.navy : palette.textMuted, fontSize: 11, fontFamily: Fonts.bodyMedium }}>
                      {item.supportedCurrencies.join(', ') || item.provider}
                    </Text>
                  </Surface>
                </Pressable>
              );
            })}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MANUAL_CHANNELS.map((manualChannel) => (
                <Pressable key={manualChannel} onPress={() => setChannel(manualChannel)}>
                  <Pill palette={palette} active={channel === manualChannel}>{manualChannel}</Pill>
                </Pressable>
              ))}
            </View>
          </View>

          {!isOnlineChannel && channel === 'MOMO' && momo ? (
            <Surface palette={palette} tone="muted" style={{ padding: 12, gap: 6, marginBottom: 12 }}>
              <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.statusBold }}>MOBILE MONEY</Text>
              <FeeLine palette={palette} label="MoMo number" value={momo.number} />
              <FeeLine palette={palette} label="MoMo Pay ID" value={momo.payId} />
              <FeeLine palette={palette} label="Account name" value={momo.accountName} />
            </Surface>
          ) : null}
          {!isOnlineChannel && channel === 'BANK' && bank ? (
            <Surface palette={palette} tone="muted" style={{ padding: 12, gap: 6, marginBottom: 12 }}>
              <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.statusBold }}>BANK TRANSFER</Text>
              <FeeLine palette={palette} label="Bank" value={`${bank.bank} - ${bank.branch}`} />
              <FeeLine palette={palette} label="Account number" value={bank.accountNo} />
              <FeeLine palette={palette} label="Account name" value={bank.accountName} />
            </Surface>
          ) : null}
          {!isOnlineChannel && (channel === 'CASH' || channel === 'OTHER') ? (
            <Surface palette={palette} tone="muted" style={{ padding: 12, marginBottom: 12 }}>
              <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body, lineHeight: 18 }}>
                Pay in cash or through another channel and the finance team will confirm your donation after verification.
              </Text>
            </Surface>
          ) : null}

          {isOnlineChannel && feeLoading ? (
            <Surface palette={palette} tone="muted" style={{ padding: 12, gap: 8, marginBottom: 12 }}>
              <SkeletonBar palette={palette} width="60%" />
              <SkeletonBar palette={palette} width="82%" />
            </Surface>
          ) : null}

          {isOnlineChannel && feePreview && feePreview.enabled && feePreview.platformFee > 0 ? (
            <Surface palette={palette} tone="muted" style={{ padding: 12, gap: 8, marginBottom: 12 }}>
              <FeeLine palette={palette} label="Donation" value={formatMoney(feePreview.amount, selectedCurrency)} />
              <FeeLine palette={palette} label={`Platform fee (${feePreview.percent}%)`} value={formatMoney(feePreview.platformFee, selectedCurrency)} />
              <FeeLine palette={palette} label="Total to pay" value={formatMoney(feePreview.totalAmount, selectedCurrency)} strong />
            </Surface>
          ) : null}

          <PrimaryButton
            label={isOnlineChannel ? 'Continue to payment' : 'Submit donation'}
            palette={palette}
            onPress={onDonate}
            loading={submitting}
            disabled={!channel}
            icon={isOnlineChannel ? 'arrow-forward' : 'heart-outline'}
          />
        </Surface>

        <SectionTitle palette={palette} title="My donations" />
        {donations.length === 0 ? (
          <EmptyState
            palette={palette}
            icon="heart-outline"
            title="No donations yet"
            description="Your contributions will appear here once you submit a donation."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {donations.map((donation, index) => {
              const row = (
                <Surface key={donation.id} palette={palette} style={{ padding: 14, gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <Text style={{ color: palette.text, fontSize: 18, fontFamily: Fonts.displayHeavy }}>
                      {formatMoney(donation.amount, donation.currency)}
                    </Text>
                    <Pill palette={palette} tone={donation.status === 'CONFIRMED' ? 'gold' : 'muted'}>{donation.status}</Pill>
                  </View>
                  <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body }}>
                    {donation.channel} · {formatShortDate(donation.createdAt)}
                  </Text>
                  {donation.transactionRef ? (
                    <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.bodyMedium }} numberOfLines={1}>
                      Ref: {donation.transactionRef}
                    </Text>
                  ) : null}
                </Surface>
              );
              return index < 8 ? (
                <FadeInUp key={donation.id} delay={Math.min(index, 7) * 40} distance={10}>{row}</FadeInUp>
              ) : (
                row
              );
            })}
          </View>
        )}
      </ScreenScroll>
    </KeyboardAvoidingView>
  );
}

function FeeLine({ palette, label, value, strong }: { palette: typeof Colors.light; label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <Text style={{ color: strong ? palette.text : palette.textMuted, fontSize: 13, fontFamily: strong ? Fonts.bodyBold : Fonts.body }}>{label}</Text>
      <Text style={{ color: strong ? Brand.gold : palette.text, fontSize: 13, fontFamily: Fonts.bodyBold, flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}
