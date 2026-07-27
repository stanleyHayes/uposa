import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Field, PrimaryButton, Surface } from '@/components/mobile-ui';
import { AuthBrandPanel } from '@/components/auth-brand-panel';

export default function LoginScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<{ text: string; error: boolean } | null>(null);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login({ email: email.trim().toLowerCase(), password });
      const { token, refreshToken, member } = res.data.data;
      await login(token, member, refreshToken);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed. Check your credentials.';
      Alert.alert('Sign in failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    const target = email.trim().toLowerCase();
    if (!target) {
      setForgotMessage({ text: 'Enter your email above, then tap Forgot password.', error: true });
      return;
    }
    setForgotLoading(true);
    setForgotMessage(null);
    try {
      await authApi.forgotPassword(target);
      setForgotMessage({ text: `If an account exists for ${target}, we've sent a password reset link. Check your inbox.`, error: false });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not send reset email. Try again later.';
      setForgotMessage({ text: msg, error: true });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.background }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <AuthBrandPanel
          palette={palette}
          eyebrow="Alumni access"
          title="Welcome back to the family."
          body="Sign in to follow events, dues, discussions, projects, jobs, and the directory."
        />

        {/* Overlapping form card */}
        <View style={styles.formZone}>
          <Surface palette={palette} style={styles.formCard}>
            <Field
              palette={palette}
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              icon="mail-outline"
              keyboardType="email-address"
            />
            <Field
              palette={palette}
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              icon="lock-closed-outline"
              secureTextEntry={!showPw}
              right={
                <Pressable onPress={() => setShowPw((value) => !value)} hitSlop={10}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={palette.textMuted} />
                </Pressable>
              }
            />

            <View style={styles.buttonRow}>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Sign in" palette={palette} onPress={onSubmit} loading={loading} icon="arrow-forward" tone="cream" />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Register"
                  palette={palette}
                  onPress={() => router.push('/(auth)/register')}
                  icon="person-add-outline"
                  tone="outline"
                />
              </View>
            </View>

            <View style={styles.footer}>
              <Pressable onPress={onForgot} disabled={forgotLoading} hitSlop={8}>
                <Text style={{ color: palette.tint, fontSize: 14, fontFamily: Fonts.bodySemiBold }}>
                  {forgotLoading ? 'Sending reset link...' : 'Forgot password?'}
                </Text>
              </Pressable>
              {forgotMessage ? (
                <Text
                  style={{
                    color: forgotMessage.error ? palette.danger : palette.success,
                    fontSize: 13,
                    fontFamily: Fonts.body,
                    textAlign: 'center',
                    lineHeight: 18,
                  }}
                >
                  {forgotMessage.text}
                </Text>
              ) : null}
              <Link href="/(auth)/register" asChild>
                <Pressable hitSlop={8}>
                  <Text style={{ color: palette.textMuted, fontSize: 14, fontFamily: Fonts.body }}>
                    New to UPOSA? <Text style={{ color: Brand.gold, fontFamily: Fonts.bodyBold }}>Create an account</Text>
                  </Text>
                </Pressable>
              </Link>
            </View>
          </Surface>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  formZone: { paddingHorizontal: 16, marginTop: -28 },
  formCard: { padding: 16, gap: 4 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  footer: { alignItems: 'center', gap: 14, paddingTop: 14 },
});
