import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Brand, Colors, Fonts, Radii, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { contactApi, transcriptsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Field, IconTile, Pill, PrimaryButton, ScreenHeader, ScreenScroll, Surface } from '@/components/mobile-ui';

type RequestTab = 'transcript' | 'recommendation';

const deliveryMethods = [
  { value: 'pickup', label: 'Pick up' },
  { value: 'mail', label: 'Mail' },
  { value: 'email', label: 'Email scan' },
] as const;

const purposes = [
  { value: 'employment', label: 'Employment' },
  { value: 'further_studies', label: 'Further studies' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'professional', label: 'Professional' },
  { value: 'other', label: 'Other' },
] as const;

export default function RequestsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const user = useAuthStore((s) => s.user);

  const [tab, setTab] = useState<RequestTab>('transcript');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<RequestTab | null>(null);

  // Transcript form
  const [copies, setCopies] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<string>('pickup');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // Recommendation form
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientOrg, setRecipientOrg] = useState('');
  const [recPurpose, setRecPurpose] = useState<string>('employment');
  const [details, setDetails] = useState('');

  const fullName = user?.fullName ?? '';
  const email = user?.email ?? '';
  const phone = user?.mobileNumber ?? '';
  const yearGroup = user?.yearGroup?.toString() ?? '';

  const onTranscriptSubmit = async () => {
    if (purpose.trim().length < 5) {
      Alert.alert('Purpose required', 'Tell us what the transcript is for (e.g. university admission, job application).');
      return;
    }
    setSubmitting(true);
    try {
      const packed = [
        user?.programme ? `Programme: ${user.programme}` : null,
        `Copies: ${copies}`,
        `Delivery: ${deliveryMethod}`,
        `Purpose: ${purpose.trim()}`,
        notes.trim() ? `Notes: ${notes.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      await transcriptsApi.request({ fullName, email, phone, yearGroup, notes: packed });
      setSubmitted('transcript');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit transcript request.';
      Alert.alert('Request failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onRecommendationSubmit = async () => {
    if (recipientName.trim().length < 2 || recipientOrg.trim().length < 2) {
      Alert.alert('Recipient required', 'Add the recipient name and organization for the letter.');
      return;
    }
    if (details.trim().length < 10) {
      Alert.alert('More detail needed', 'Describe what the letter should highlight so the administration can prepare it properly.');
      return;
    }
    setSubmitting(true);
    try {
      const subject = `Recommendation request for ${recipientOrg.trim()}`;
      const message = [
        `Recommendation request from ${fullName}${yearGroup ? ` (${yearGroup})` : ''}`,
        phone ? `Phone: ${phone}` : null,
        '',
        `Recipient: ${recipientName.trim()}, ${recipientOrg.trim()}`,
        recipientEmail.trim() ? `Recipient email: ${recipientEmail.trim()}` : null,
        `Purpose: ${recPurpose}`,
        `Details: ${details.trim()}`,
      ]
        .filter(Boolean)
        .join('\n');

      await contactApi.send({ name: fullName, email, subject, message });
      setSubmitted('recommendation');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit recommendation request.';
      Alert.alert('Request failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isTranscript = tab === 'transcript';

  return (
    <ScreenScroll palette={palette} keyboardShouldPersistTaps="handled">
      <ScreenHeader
        palette={palette}
        eyebrow="Service requests"
        title="Requests"
        description="Request transcripts and recommendation letters with the details the administration needs."
        icon="document-text-outline"
      />

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        <TabPill palette={palette} label="Transcript" active={tab === 'transcript'} onPress={() => { setTab('transcript'); setSubmitted(null); }} />
        <TabPill palette={palette} label="Recommendation letter" active={tab === 'recommendation'} onPress={() => { setTab('recommendation'); setSubmitted(null); }} />
      </View>

      {submitted ? (
        <Surface palette={palette} style={{ padding: 26, alignItems: 'center', gap: 12 }}>
          <IconTile icon="checkmark-circle-outline" palette={palette} tone="gold" size={28} />
          <Text style={{ color: palette.text, fontSize: 20, fontFamily: Fonts.display }}>Request submitted</Text>
          <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19, textAlign: 'center' }}>
            {submitted === 'transcript'
              ? 'Your transcript request has been sent. Watch your email for payment instructions, confirmation, and processing details.'
              : 'Your recommendation request has been sent. The school administration will review the details and process the letter.'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pill palette={palette} tone="navy">
              {submitted === 'transcript' ? 'Estimated processing: 5-10 business days' : 'Estimated processing: 7-14 business days'}
            </Pill>
          </View>
          <View style={{ alignSelf: 'stretch', marginTop: 6 }}>
            <PrimaryButton label="Submit another" palette={palette} onPress={() => setSubmitted(null)} tone="gold" icon="add-outline" />
          </View>
        </Surface>
      ) : (
        <Surface palette={palette} style={{ padding: 16 }}>
          <Text style={{ color: palette.text, fontSize: 17, fontFamily: Fonts.display, marginBottom: 4 }}>
            {isTranscript ? 'Request academic records' : 'Request a school letter'}
          </Text>
          <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19, marginBottom: 14 }}>
            {isTranscript
              ? 'Choose copies and delivery, then tell us the purpose so the school can prepare the right record.'
              : 'Share recipient details and purpose so the administration can prepare the letter properly.'}
          </Text>

          {isTranscript ? (
            <>
              <Text style={{ color: palette.text, fontSize: 12, fontFamily: Fonts.bodySemiBold, marginBottom: 7 }}>Number of copies</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((count) => (
                  <OptionPill key={count} palette={palette} label={`${count}`} active={copies === count} onPress={() => setCopies(count)} />
                ))}
              </View>

              <Text style={{ color: palette.text, fontSize: 12, fontFamily: Fonts.bodySemiBold, marginBottom: 7 }}>Delivery method</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {deliveryMethods.map((method) => (
                  <OptionPill key={method.value} palette={palette} label={method.label} active={deliveryMethod === method.value} onPress={() => setDeliveryMethod(method.value)} />
                ))}
              </View>

              <Field
                palette={palette}
                label="Purpose"
                value={purpose}
                onChangeText={setPurpose}
                placeholder="e.g. University admission, job application..."
                icon="create-outline"
                multiline
              />
              <Field
                palette={palette}
                label="Additional notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special instructions..."
                icon="chatbox-outline"
                multiline
              />

              <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body, lineHeight: 17, marginBottom: 12 }}>
                Processing fee is GHS 20 per copy. Payment instructions will be sent after submission.
              </Text>
              <PrimaryButton label="Submit request" palette={palette} onPress={onTranscriptSubmit} loading={submitting} icon="send-outline" />
            </>
          ) : (
            <>
              <Field
                palette={palette}
                label="Recipient / addressed to"
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="e.g. Admissions Office"
                icon="person-outline"
              />
              <Field
                palette={palette}
                label="Recipient email"
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                placeholder="Optional direct submission"
                icon="mail-outline"
                keyboardType="email-address"
              />
              <Field
                palette={palette}
                label="Organization"
                value={recipientOrg}
                onChangeText={setRecipientOrg}
                placeholder="e.g. University of Ghana"
                icon="business-outline"
              />

              <Text style={{ color: palette.text, fontSize: 12, fontFamily: Fonts.bodySemiBold, marginBottom: 7 }}>Purpose</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {purposes.map((item) => (
                  <OptionPill key={item.value} palette={palette} label={item.label} active={recPurpose === item.value} onPress={() => setRecPurpose(item.value)} />
                ))}
              </View>

              <Field
                palette={palette}
                label="Extra details"
                value={details}
                onChangeText={setDetails}
                placeholder="Describe what the letter should highlight..."
                icon="create-outline"
                multiline
              />

              <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body, lineHeight: 17, marginBottom: 12 }}>
                Letters are prepared from school records. Urgent requests may incur additional fees.
              </Text>
              <PrimaryButton label="Submit request" palette={palette} onPress={onRecommendationSubmit} loading={submitting} icon="send-outline" />
            </>
          )}
        </Surface>
      )}
    </ScreenScroll>
  );
}

function TabPill({ palette, label, active, onPress }: { palette: Palette; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.78 : 1 })}>
      <View
        style={{
          minHeight: 42,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: active ? Brand.gold : palette.border,
          backgroundColor: active ? Brand.gold : palette.surface,
          ...Radii.button,
        }}
      >
        <Text
          style={{
            color: active ? Brand.navy : palette.textMuted,
            fontSize: 12,
            fontFamily: Fonts.statusBold,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function OptionPill({ palette, label, active, onPress }: { palette: Palette; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
      <View
        style={{
          minHeight: 34,
          minWidth: 40,
          paddingHorizontal: 12,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: active ? Brand.gold : palette.border,
          backgroundColor: active ? Brand.gold : palette.surfaceMuted,
          ...Radii.tile,
        }}
      >
        <Text
          style={{
            color: active ? Brand.navy : palette.textMuted,
            fontSize: 12,
            fontFamily: Fonts.statusBold,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
