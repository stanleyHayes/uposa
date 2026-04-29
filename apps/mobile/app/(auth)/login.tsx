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
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

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
      Alert.alert(
        'Check your inbox',
        `If an account exists for ${target}, we've sent a password reset link.`
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not send reset email. Try again later.';
      Alert.alert('Reset failed', msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.brandBlock]}>
          <View style={[styles.logoCircle, { backgroundColor: Brand.navy }]}>
            <Text style={[styles.logoMark, { color: Brand.gold }]}>U</Text>
          </View>
          <Text style={[styles.brand, { color: palette.text }]}>UPOSA Alumni</Text>
          <Text style={[styles.tagline, { color: palette.textMuted }]}>
            Welcome back. Sign in to your account.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.label, { color: palette.text }]}>Email</Text>
          <View style={[styles.inputWrap, { borderColor: palette.border, backgroundColor: palette.background }]}>
            <Ionicons name="mail-outline" size={18} color={palette.textMuted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={palette.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={[styles.input, { color: palette.text }]}
            />
          </View>

          <Text style={[styles.label, { color: palette.text, marginTop: 14 }]}>Password</Text>
          <View style={[styles.inputWrap, { borderColor: palette.border, backgroundColor: palette.background }]}>
            <Ionicons name="lock-closed-outline" size={18} color={palette.textMuted} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={palette.textMuted}
              secureTextEntry={!showPw}
              style={[styles.input, { color: palette.text }]}
            />
            <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={10}>
              <Ionicons
                name={showPw ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={palette.textMuted}
              />
            </Pressable>
          </View>

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={({ pressed }) => [
              styles.btnPrimary,
              { backgroundColor: Brand.navy, opacity: pressed || loading ? 0.85 : 1 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={Brand.cream} />
            ) : (
              <Text style={[styles.btnPrimaryText]}>Sign In</Text>
            )}
          </Pressable>

          <Pressable onPress={onForgot} disabled={forgotLoading} hitSlop={6} style={styles.linkRow}>
            <Text style={[styles.linkText, { color: palette.tint }]}>
              {forgotLoading ? 'Sending…' : 'Forgot password?'}
            </Text>
          </Pressable>

          <Link href="/(auth)/register" asChild>
            <Pressable style={styles.linkRow} hitSlop={6}>
              <Text style={[styles.linkText, { color: palette.textMuted }]}>
                New to UPOSA?{' '}
                <Text style={{ color: palette.tint, fontWeight: '600' }}>Create an account</Text>
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brandBlock: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoMark: { fontSize: 30, fontWeight: '800' },
  brand: { fontSize: 22, fontWeight: '700', letterSpacing: 0.3 },
  tagline: { fontSize: 14, marginTop: 4, textAlign: 'center' },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    gap: 4,
  },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  input: { flex: 1, fontSize: 15 },
  btnPrimary: {
    marginTop: 22,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: Brand.cream, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  linkRow: { alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 14 },
});
