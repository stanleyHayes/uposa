import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi } from '@/lib/api';
import { EmptyState, Field, PrimaryButton, Surface } from '@/components/mobile-ui';
import { AuthBrandPanel } from '@/components/auth-brand-panel';

export default function ResetPasswordScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { token } = useLocalSearchParams<{ token?: string }>();
  const resetToken = typeof token === 'string' ? token : '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const onSubmit = async () => {
    const next: { password?: string; confirm?: string } = {};
    if (password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
    }
    if (confirm !== password) {
      next.confirm = 'Passwords do not match.';
    }
    setErrors(next);
    if (next.password || next.confirm) return;

    setLoading(true);
    try {
      await authApi.resetPassword({ token: resetToken, password });
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to reset password. The link may have expired.';
      Alert.alert('Reset failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.background }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
      >
        <AuthBrandPanel
          palette={palette}
          eyebrow="Account security"
          title="Choose a new password."
          body="Set a strong password to keep your alumni account safe."
        />

        <View style={{ paddingHorizontal: 16, marginTop: -28 }}>
          {!resetToken ? (
            <EmptyState
              palette={palette}
              icon="link-outline"
              title="Invalid reset link"
              description="This password reset link is missing or invalid. Request a new link from the sign-in screen."
              action={
                <PrimaryButton
                  label="Back to sign in"
                  palette={palette}
                  onPress={() => router.replace('/(auth)/login')}
                  icon="arrow-back"
                />
              }
            />
          ) : success ? (
            <Surface palette={palette} style={{ padding: 20, alignItems: 'center', gap: 10 }}>
              <Ionicons name="checkmark-circle" size={48} color={palette.tint} />
              <Text style={{ color: palette.text, fontSize: 20, fontFamily: Fonts.display }}>Password reset!</Text>
              <Text style={{ color: palette.textMuted, fontSize: 14, fontFamily: Fonts.body, lineHeight: 20, textAlign: 'center' }}>
                Your password has been successfully reset. You can now sign in with your new password.
              </Text>
              <View style={{ alignSelf: 'stretch', marginTop: 6 }}>
                <PrimaryButton
                  label="Continue to sign in"
                  palette={palette}
                  onPress={() => router.replace('/(auth)/login')}
                  icon="arrow-forward"
                />
              </View>
            </Surface>
          ) : (
            <Surface palette={palette} style={{ padding: 16, gap: 4 }}>
              <Field
                palette={palette}
                label="New password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                }}
                placeholder="At least 8 characters"
                icon="lock-closed-outline"
                secureTextEntry={!showPw}
                right={
                  <Pressable onPress={() => setShowPw((value) => !value)} hitSlop={10}>
                    <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={palette.textMuted} />
                  </Pressable>
                }
              />
              {errors.password ? (
                <Text style={{ color: palette.danger, fontSize: 12, fontFamily: Fonts.body, marginBottom: 6 }}>{errors.password}</Text>
              ) : null}
              <Field
                palette={palette}
                label="Confirm new password"
                value={confirm}
                onChangeText={(value) => {
                  setConfirm(value);
                  if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }));
                }}
                placeholder="Repeat your password"
                icon="checkmark-done-outline"
                secureTextEntry={!showPw}
              />
              {errors.confirm ? (
                <Text style={{ color: palette.danger, fontSize: 12, fontFamily: Fonts.body, marginBottom: 6 }}>{errors.confirm}</Text>
              ) : null}

              <PrimaryButton label="Reset password" palette={palette} onPress={onSubmit} loading={loading} icon="key-outline" />

              <View style={{ alignItems: 'center', paddingTop: 14 }}>
                <Link href="/(auth)/login" asChild>
                  <Pressable hitSlop={8}>
                    <Text style={{ color: palette.textMuted, fontSize: 14, fontFamily: Fonts.body }}>
                      Remembered it? <Text style={{ color: Brand.gold, fontFamily: Fonts.bodyBold }}>Back to sign in</Text>
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </Surface>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
