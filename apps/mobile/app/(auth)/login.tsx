import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Field, HeroPanel, PrimaryButton, ScreenScroll, Surface } from '@/components/mobile-ui';

export default function LoginScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

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
      Alert.alert('Email needed', 'Enter your email above, then tap Forgot password.');
      return;
    }
    setForgotLoading(true);
    try {
      await authApi.forgotPassword(target);
      Alert.alert('Check your inbox', `If an account exists for ${target}, we've sent a password reset link.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not send reset email. Try again later.';
      Alert.alert('Reset failed', msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenScroll palette={palette} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <HeroPanel
          palette={palette}
          eyebrow="Alumni access"
          title="Your member desk, in your pocket."
          body="Sign in to follow events, dues, discussions, projects, jobs, and the directory."
          icon="id-card-outline"
        />

        <Surface palette={palette} style={{ padding: 16, gap: 4 }}>
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

          <PrimaryButton label="Sign in" palette={palette} onPress={onSubmit} loading={loading} icon="arrow-forward" />

          <View style={{ alignItems: 'center', gap: 14, paddingTop: 14 }}>
            <Pressable onPress={onForgot} disabled={forgotLoading} hitSlop={8}>
              <Text style={{ color: palette.tint, fontSize: 14, fontWeight: '800' }}>
                {forgotLoading ? 'Sending reset link...' : 'Forgot password?'}
              </Text>
            </Pressable>
            <Link href="/(auth)/register" asChild>
              <Pressable hitSlop={8}>
                <Text style={{ color: palette.textMuted, fontSize: 14 }}>
                  New to UPOSA? <Text style={{ color: Brand.gold, fontWeight: '900' }}>Create an account</Text>
                </Text>
              </Pressable>
            </Link>
          </View>
        </Surface>
      </ScreenScroll>
    </KeyboardAvoidingView>
  );
}
