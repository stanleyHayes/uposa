import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/auth-store';
import { contactApi } from '@/lib/api';
import { ActionRow, Field, HeroPanel, PrimaryButton, ScreenHeader, ScreenScroll, Surface } from '@/components/mobile-ui';

export default function ContactScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert('Missing fields', 'All fields are required.');
      return;
    }
    setSubmitting(true);
    try {
      await contactApi.send({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
      });
      Alert.alert('Message sent', 'Thanks. We will be in touch soon.');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not send your message. Try again later.';
      Alert.alert('Send failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenScroll palette={palette} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          palette={palette}
          eyebrow="Support desk"
          title="Contact"
          description="Send questions, service requests, feedback, or association notes."
          icon="mail-outline"
        />
        <HeroPanel
          palette={palette}
          eyebrow="Member help"
          title="Reach the association desk without leaving mobile."
          body="Use this for dues questions, profile issues, transcript paths, mentorship, or general support."
          icon="headset-outline"
        />
        <ActionRow palette={palette} icon="time-outline" title="Response lane" description="Messages are routed to the association desk for follow-up." />
        <Surface palette={palette} style={{ padding: 16, gap: 2, marginTop: 16 }}>
          <Field palette={palette} label="Name" value={name} onChangeText={setName} icon="person-outline" />
          <Field palette={palette} label="Email" value={email} onChangeText={setEmail} icon="mail-outline" keyboardType="email-address" />
          <Field palette={palette} label="Subject" value={subject} onChangeText={setSubject} icon="bookmark-outline" />
          <Field palette={palette} label="Message" value={message} onChangeText={setMessage} icon="create-outline" multiline />
          <PrimaryButton label="Send message" palette={palette} onPress={onSubmit} loading={submitting} icon="send-outline" />
        </Surface>
      </ScreenScroll>
    </KeyboardAvoidingView>
  );
}
