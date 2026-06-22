import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, Text, View } from 'react-native';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { duesApi, paymentMethodsApi, paymentsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { Due, PaymentMethod, PaymentProvider } from '@/lib/types';
import {
  EmptyState,
  HeroPanel,
  LoadingState,
  Pill,
  PrimaryButton,
  ScreenScroll,
  SectionTitle,
  Surface,
  formatMoney,
} from '@/components/mobile-ui';

interface DuesSummary {
  totalDues: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

export default function DuesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const user = useAuthStore((s) => s.user);

  const [dues, setDues] = useState<Due[]>([]);
  const [summary, setSummary] = useState<DuesSummary | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [provider, setProvider] = useState<PaymentProvider | ''>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingDueId, setSubmittingDueId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [duesRes, summaryRes, methodsRes] = await Promise.allSettled([
        duesApi.my(),
        duesApi.summary(),
        paymentMethodsApi.list(),
      ]);
      setDues(duesRes.status === 'fulfilled' ? duesRes.value.data.data ?? [] : []);
      setSummary(summaryRes.status === 'fulfilled' ? summaryRes.value.data.data ?? null : null);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onPay = async (due?: Due) => {
    const selectedDue = due ?? [...dues.filter((item) => item.status !== 'PAID')].sort((a, b) => a.year - b.year)[0];
    if (!selectedDue) {
      Alert.alert('No balance', 'There are no pending dues to settle.');
      return;
    }
    if (!user?.email) {
      Alert.alert('Missing email', 'Your account needs an email address before payment can start.');
      return;
    }
    const selectedMethod = paymentMethods.find((method) => method.provider === provider);
    if (!provider || !selectedMethod) {
      Alert.alert('Payment unavailable', 'No online payment provider is enabled right now.');
      return;
    }
    setSubmittingDueId(selectedDue.id);
    try {
      const res = await paymentsApi.initialize({
        provider,
        purpose: 'DUES',
        amount: selectedDue.amount,
        currency: 'GHS',
        email: user.email,
        name: user.fullName,
        dueId: selectedDue.id,
      });
      const url = res.data.data?.authorizationUrl;
      if (url) {
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

  if (loading) return <LoadingState palette={palette} title="My dues" />;

  const pendingAmount = summary?.totalPending ?? dues.filter((due) => due.status !== 'PAID').reduce((sum, due) => sum + due.amount, 0);
  const paidAmount = summary?.totalPaid ?? dues.filter((due) => due.status === 'PAID').reduce((sum, due) => sum + due.amount, 0);
  const overdueAmount = summary?.totalOverdue ?? dues.filter((due) => due.status === 'OVERDUE').reduce((sum, due) => sum + due.amount, 0);
  const pendingDues = dues.filter((due) => due.status !== 'PAID');
  const nextDue = [...pendingDues].sort((a, b) => a.year - b.year)[0];

  return (
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
          <Text style={{ color: palette.textMuted, fontSize: 11, fontWeight: '900' }}>PAID</Text>
          <Text style={{ color: palette.text, fontSize: 18, fontWeight: '900', marginTop: 6 }}>{formatMoney(paidAmount)}</Text>
        </Surface>
        <Surface palette={palette} style={{ flex: 1, padding: 12 }}>
          <Text style={{ color: palette.textMuted, fontSize: 11, fontWeight: '900' }}>OVERDUE</Text>
          <Text style={{ color: palette.text, fontSize: 18, fontWeight: '900', marginTop: 6 }}>{formatMoney(overdueAmount)}</Text>
        </Surface>
      </View>

      <SectionTitle palette={palette} title="Payment provider" />
      {paymentMethods.length === 0 ? (
        <EmptyState
          palette={palette}
          icon="card-outline"
          title="Online payment is unavailable"
          description="Ask the association desk to enable a GHS payment provider."
        />
      ) : (
        <View style={{ gap: 10, marginBottom: 16 }}>
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

      {nextDue ? (
        <PrimaryButton
          label={`Pay ${nextDue.year} due`}
          palette={palette}
          onPress={() => onPay(nextDue)}
          loading={submittingDueId === nextDue.id}
          disabled={paymentMethods.length === 0 || Boolean(submittingDueId)}
          icon="arrow-forward"
        />
      ) : null}

      <SectionTitle palette={palette} title="Dues records" />
      {dues.length === 0 ? (
        <EmptyState palette={palette} icon="card-outline" title="No dues records" description="Dues records assigned to your account will appear here." />
      ) : (
        <View style={{ gap: 10 }}>
          {dues.map((due) => (
            <Surface key={due.id} palette={palette} style={{ padding: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <View>
                  <Text style={{ color: palette.text, fontSize: 17, fontWeight: '900' }}>{due.year} dues</Text>
                  <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 3 }}>{due.paidAt ? `Paid ${new Date(due.paidAt).toLocaleDateString()}` : 'Payment pending'}</Text>
                </View>
                <Pill palette={palette} tone={due.status === 'PAID' ? 'gold' : 'muted'}>{due.status}</Pill>
              </View>
              <Text style={{ color: palette.text, fontSize: 20, fontWeight: '900' }}>{formatMoney(due.amount)}</Text>
              {due.status !== 'PAID' ? (
                <PrimaryButton
                  label={`Pay ${due.year}`}
                  palette={palette}
                  onPress={() => onPay(due)}
                  loading={submittingDueId === due.id}
                  disabled={paymentMethods.length === 0 || (submittingDueId !== null && submittingDueId !== due.id)}
                  tone="gold"
                  icon="arrow-forward"
                />
              ) : null}
            </Surface>
          ))}
        </View>
      )}
    </ScreenScroll>
  );
}
