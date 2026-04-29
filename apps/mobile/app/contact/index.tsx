import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { useAuthStore } from '@/lib/auth-store';
import { contactApi } from '@/lib/api';

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
      Alert.alert('Message sent', 'Thanks — we’ll be in touch soon.');
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
      style={[styles.flex, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={[styles.iconBubble, { backgroundColor: Brand.cream }]}>
            <Ionicons name="mail-outline" size={22} color={Brand.navy} />
          </View>
          <Text style={[styles.title, { color: palette.text }]}>Get in touch</Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>
            Questions, feedback, or just want to say hello? Drop us a note.
          </Text>

          <Field
            label="Name"
            value={name}
            onChangeText={setName}
            palette={palette}
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            palette={palette}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            palette={palette}
          />
          <Field
            label="Message"
            value={message}
            onChangeText={setMessage}
            palette={palette}
            multiline
          />

          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.btnPrimary,
              { backgroundColor: Brand.navy, opacity: pressed || submitting ? 0.85 : 1 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={Brand.cream} />
            ) : (
              <Text style={styles.btnPrimaryText}>Send message</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  palette: typeof Colors.light;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}

function Field({ label, value, onChangeText, palette, multiline, keyboardType, autoCapitalize }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={!multiline}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          {
            color: palette.text,
            borderColor: palette.border,
            backgroundColor: palette.background,
          },
        ]}
        placeholderTextColor={palette.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: 16 },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 16, lineHeight: 18 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 44,
  },
  inputMultiline: { minHeight: 110, textAlignVertical: 'top' },
  btnPrimary: {
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: Brand.cream, fontSize: 16, fontWeight: '700' },
});
