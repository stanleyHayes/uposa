import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { duesApi, paymentMethodsApi, paymentsApi, publicApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { Due, PaymentMethod, PaymentProvider, SiteConfig } from '@/lib/types';
import {
  EmptyState,
  Field,
  HeroPanel,
  LoadingState,
  Pill,
  PrimaryButton,
  ScreenScroll,
  SectionTitle,
  Surface,
  formatMoney,
} from '@/components/mobile-ui';
import { FadeInUp } from '@/components/motion';

interface DuesSummary {
  totalDues: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

type ManualChannel = 'MOMO' | 'BANK' | 'CASH' | 'OTHER';

const MANUAL_CHANNELS: ManualChannel[] = ['MOMO', 'BANK', 'CASH', 'OTHER'];

export default function DuesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const user = useAuthStore((s) => s.user);

  const [dues, setDues] = useState<Due[]>([]);
  const [summary, setSummary] = useState<DuesSummary | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [provider, setProvider] = useState<PaymentProvider | ''>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingDueId, setSubmittingDueId] = useState<string | null>(null);

  const [payDue, setPayDue] = useState<Due | null>(null);
  const [payMode, setPayMode] = useState<'online' | 'manual'>('online');
  const [manualChannel, setManualChannel] = useState<ManualChannel>('MOMO');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [pendingReference, setPendingReference] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [duesRes, summaryRes, methodsRes, siteRes] = await Promise.allSettled([
        duesApi.my(),
        duesApi.summary(),
        paymentMethodsApi.list(),
        publicApi.siteData(),
      ]);
      setDues(duesRes.status === 'fulfilled' ? duesRes.value.data.data ?? [] : []);
      setSummary(summaryRes.status === 'fulfilled' ? summaryRes.value.data.data ?? null : null);
      setSiteConfig(siteRes.status === 'fulfilled' ? siteRes.value.data.data?.config ?? null : null);
      const enabledMethods = methodsRes.status === 'fulfilled' ? methodsRes.value.data.data ?? [] : [];
      const duesMethods = enabledMethods.filter((method) => method.supportedCurrencies.includes('GHS'));
      setPaymentMethods(duesMethods);
      setProvider((current) => {
        if (current && duesMethods.some((method) => method.provider === current)) return current;
        return duesMethods[0]?.provider ?? '';
      });
    } finally {
      setLoading(false);
    }
  }, []);

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
          Alert.alert('Payment confirmed', 'Your dues payment was confirmed. Thank you.');
        } else if (status === 'FAILED' || status === 'CANCELLED') {
          setPendingReference(null);
          Alert.alert('Payment not completed', 'The payment did not go through. You can try again.');
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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openPayModal = (due: Due) => {
    setPayDue(due);
    setPayMode(paymentMethods.length > 0 ? 'online' : 'manual');
    setManualChannel('MOMO');
    setTransactionRef('');
    setNotes('');
  };

  const onPayOnline = async (due: Due) => {
    if (!user?.email) {
      Alert.alert('Missing email', 'Your account needs an email address before payment can start.');
      return;
    }
    const selectedMethod = paymentMethods.find((method) => method.provider === provider);
    if (!provider || !selectedMethod) {
      Alert.alert('Payment unavailable', 'No online payment provider is enabled right now.');
      return;
    }
    setSubmittingDueId(due.id);
    try {
      const res = await paymentsApi.initialize({
        provider,
        purpose: 'DUES',
        amount: due.amount,
        currency: 'GHS',
        email: user.email,
        name: user.fullName,
        dueId: due.id,
      });
      const url = res.data.data?.authorizationUrl;
      const reference = res.data.data?.reference;
      if (url) {
        if (reference) setPendingReference(reference);
        setPayDue(null);
        await Linking.openURL(url);
      } else {
        Alert.alert('Payment issue', 'No payment URL was returned.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not initialize dues payment.';
      Alert.alert('Payment failed', msg);
    } finally {
      setSubmittingDueId(null);
    }
  };

  const onManualPay = async () => {
    if (!payDue) return;
    if (!transactionRef.trim()) {
      Alert.alert('Reference required', 'Enter the MoMo or bank transaction reference for your payment.');
      return;
    }
    setManualSubmitting(true);
    try {
      await duesApi.pay(payDue.id, {
        transactionRef: transactionRef.trim(),
        channel: manualChannel,
        notes: notes.trim() || undefined,
      });
      setPayDue(null);
      Alert.alert('Payment submitted', 'Your manual payment reference was submitted for verification by the finance team.');
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not submit the manual payment.';
      Alert.alert('Submission failed', msg);
    } finally {
      setManualSubmitting(false);
    }
  };

  if (loading) return <LoadingState palette={palette} title="My dues" />;

  const pendingAmount = summary?.totalPending ?? dues.filter((due) => due.status !== 'PAID').reduce((sum, due) => sum + due.amount, 0);
  const paidAmount = summary?.totalPaid ?? dues.filter((due) => due.status === 'PAID').reduce((sum, due) => sum + due.amount, 0);
  const overdueAmount = summary?.totalOverdue ?? dues.filter((due) => due.status === 'OVERDUE').reduce((sum, due) => sum + due.amount, 0);
  const pendingDues = dues.filter((due) => due.status !== 'PAID');
  const nextDue = [...pendingDues].sort((a, b) => a.year - b.year)[0];
  const momo = siteConfig?.payment?.momo;
  const bank = siteConfig?.payment?.bank;

  return (
    <>
      <ScreenScroll
        palette={palette}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
      >
        <HeroPanel
          palette={palette}
          eyebrow={pendingAmount > 0 ? 'Balance due' : 'All clear'}
          title={pendingAmount > 0 ? `${formatMoney(pendingAmount)} pending` : 'No pending dues'}
          body="Review year dues and settle balances from the mobile alumni desk."
          icon="card-outline"
        />

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <Surface palette={palette} style={{ flex: 1, padding: 12 }}>
            <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.statusBold }}>PAID</Text>
            <Text style={{ color: palette.text, fontSize: 18, fontFamily: Fonts.displayHeavy, marginTop: 6 }}>{formatMoney(paidAmount)}</Text>
          </Surface>
          <Surface palette={palette} style={{ flex: 1, padding: 12 }}>
            <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.statusBold }}>OVERDUE</Text>
            <Text style={{ color: palette.text, fontSize: 18, fontFamily: Fonts.displayHeavy, marginTop: 6 }}>{formatMoney(overdueAmount)}</Text>
          </Surface>
        </View>

        {nextDue ? (
          <PrimaryButton
            label={`Pay ${nextDue.year} due`}
            palette={palette}
            onPress={() => openPayModal(nextDue)}
            disabled={Boolean(submittingDueId)}
            icon="arrow-forward"
          />
        ) : null}

        <SectionTitle palette={palette} title="Dues records" />
        {dues.length === 0 ? (
          <EmptyState palette={palette} icon="card-outline" title="No dues records" description="Dues records assigned to your account will appear here." />
        ) : (
          <View style={{ gap: 10 }}>
            {dues.map((due, index) => {
              const row = (
                <Surface key={due.id} palette={palette} style={{ padding: 14, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <View>
                      <Text style={{ color: palette.text, fontSize: 17, fontFamily: Fonts.bodyBold }}>{due.year} dues</Text>
                      <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body, marginTop: 3 }}>{due.paidAt ? `Paid ${new Date(due.paidAt).toLocaleDateString()}` : 'Payment pending'}</Text>
                    </View>
                    <Pill palette={palette} tone={due.status === 'PAID' ? 'gold' : 'muted'}>{due.status}</Pill>
                  </View>
                  <Text style={{ color: palette.text, fontSize: 20, fontFamily: Fonts.displayHeavy }}>{formatMoney(due.amount)}</Text>
                  {due.status !== 'PAID' ? (
                    <PrimaryButton
                      label={`Pay ${due.year}`}
                      palette={palette}
                      onPress={() => openPayModal(due)}
                      loading={submittingDueId === due.id}
                      disabled={submittingDueId !== null && submittingDueId !== due.id}
                      tone="gold"
                      icon="arrow-forward"
                    />
                  ) : null}
                </Surface>
              );
              return index < 8 ? (
                <FadeInUp key={due.id} delay={Math.min(index, 7) * 40} distance={10}>{row}</FadeInUp>
              ) : (
                row
              );
            })}
          </View>
        )}
      </ScreenScroll>

      <Modal visible={!!payDue} transparent animationType="slide" onRequestClose={() => setPayDue(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
            <Surface palette={palette} style={{ borderBottomWidth: 0, maxHeight: '92%' }}>
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.text, fontSize: 18, fontFamily: Fonts.display }}>
                      {payDue ? `Pay ${payDue.year} dues` : 'Pay dues'}
                    </Text>
                    <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, marginTop: 3 }}>
                      {payDue ? `${formatMoney(payDue.amount)} · settle online or submit a manual reference` : ''}
                    </Text>
                  </View>
                  <Pressable onPress={() => setPayDue(null)} hitSlop={10}>
                    <Ionicons name="close" size={24} color={palette.textMuted} />
                  </Pressable>
                </View>

                <View style={{ gap: 10 }}>
                  <PayOption
                    palette={palette}
                    active={payMode === 'online'}
                    icon="card-outline"
                    title="Pay online"
                    description="Continue through an enabled payment provider."
                    onPress={() => setPayMode('online')}
                  />
                  <PayOption
                    palette={palette}
                    active={payMode === 'manual'}
                    icon="receipt-outline"
                    title="I paid manually"
                    description="Send MoMo or bank transfer first, then submit your reference."
                    onPress={() => setPayMode('manual')}
                  />
                </View>

                {payMode === 'online' ? (
                  <View style={{ gap: 10 }}>
                    {paymentMethods.length === 0 ? (
                      <EmptyState
                        palette={palette}
                        icon="card-outline"
                        title="Online payment is unavailable"
                        description="Ask the association desk to enable a GHS payment provider, or use the manual option."
                      />
                    ) : (
                      paymentMethods.map((item) => {
                        const active = provider === item.provider;
                        return (
                          <Pressable key={item.id} onPress={() => setProvider(item.provider)}>
                            <Surface palette={palette} tone={active ? 'gold' : 'default'} style={{ padding: 12, gap: 4 }}>
                              <Text style={{ color: active ? Brand.navy : palette.text, fontSize: 13, fontFamily: Fonts.statusBold }}>{item.displayName}</Text>
                              <Text style={{ color: active ? Brand.navy : palette.textMuted, fontSize: 11, fontFamily: Fonts.bodyMedium }}>
                                {item.supportedCurrencies.join(', ') || item.provider}
                              </Text>
                            </Surface>
                          </Pressable>
                        );
                      })
                    )}
                    {paymentMethods.length > 0 && payDue ? (
                      <PrimaryButton
                        label="Continue online"
                        palette={palette}
                        onPress={() => onPayOnline(payDue)}
                        loading={submittingDueId === payDue.id}
                        disabled={Boolean(submittingDueId)}
                        icon="arrow-forward"
                      />
                    ) : null}
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {manualChannel === 'MOMO' && momo ? (
                      <Surface palette={palette} tone="muted" style={{ padding: 12, gap: 6 }}>
                        <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.statusBold }}>MOBILE MONEY</Text>
                        <RailLine palette={palette} label="MoMo number" value={momo.number} />
                        <RailLine palette={palette} label="MoMo Pay ID" value={momo.payId} />
                        <RailLine palette={palette} label="Account name" value={momo.accountName} />
                      </Surface>
                    ) : null}
                    {manualChannel === 'BANK' && bank ? (
                      <Surface palette={palette} tone="muted" style={{ padding: 12, gap: 6 }}>
                        <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.statusBold }}>BANK TRANSFER</Text>
                        <RailLine palette={palette} label="Bank" value={`${bank.bank} - ${bank.branch}`} />
                        <RailLine palette={palette} label="Account number" value={bank.accountNo} />
                        <RailLine palette={palette} label="Account name" value={bank.accountName} />
                      </Surface>
                    ) : null}

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {MANUAL_CHANNELS.map((channel) => (
                        <Pressable key={channel} onPress={() => setManualChannel(channel)}>
                          <Pill palette={palette} active={manualChannel === channel}>{channel}</Pill>
                        </Pressable>
                      ))}
                    </View>

                    <Field
                      palette={palette}
                      label="Transaction reference"
                      value={transactionRef}
                      onChangeText={setTransactionRef}
                      placeholder="MoMo or bank reference"
                      icon="receipt-outline"
                    />
                    <Field
                      palette={palette}
                      label="Notes (optional)"
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Optional context for the finance team"
                      icon="create-outline"
                      multiline
                    />
                    <PrimaryButton
                      label="Submit payment"
                      palette={palette}
                      onPress={onManualPay}
                      loading={manualSubmitting}
                      disabled={manualSubmitting}
                      tone="gold"
                      icon="checkmark"
                    />
                  </View>
                )}
              </ScrollView>
            </Surface>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function PayOption({
  palette,
  active,
  icon,
  title,
  description,
  onPress,
}: {
  palette: typeof Colors.light;
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
      <Surface palette={palette} tone={active ? 'gold' : 'default'} style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name={icon} size={20} color={active ? Brand.navy : palette.textMuted} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: active ? Brand.navy : palette.text, fontSize: 14, fontFamily: Fonts.bodyBold }}>{title}</Text>
          <Text style={{ color: active ? Brand.navy : palette.textMuted, fontSize: 12, fontFamily: Fonts.body }}>{description}</Text>
        </View>
        <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={18} color={active ? Brand.navy : palette.textMuted} />
      </Surface>
    </Pressable>
  );
}

function RailLine({ palette, label, value }: { palette: typeof Colors.light; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body }}>{label}</Text>
      <Text style={{ color: palette.text, fontSize: 12, fontFamily: Fonts.bodyBold, flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}
