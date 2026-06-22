import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useThemePreference, type ThemePreference } from '@/lib/theme-context';
import { Field, HeroPanel, PrimaryButton, ScreenHeader, ScreenScroll, Surface } from '@/components/mobile-ui';

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const logout = useAuthStore((s) => s.logout);
  const { preference, setPreference } = useThemePreference();

  const themeOptions: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'light', label: 'Light', icon: 'sunny-outline' },
    { value: 'dark', label: 'Dark', icon: 'moon-outline' },
    { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onChangePassword = async () => {
    if (!currentPw || !newPw) {
      Alert.alert('Missing fields', 'Enter your current and new password.');
      return;
    }
    if (newPw.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Passwords do not match', 'Re-enter your new password to confirm.');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
      Alert.alert('Password updated', 'Your password has been changed.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not change password.';
      Alert.alert('Change failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onLogout = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to access your account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const visibilityToggle = (
    <Pressable onPress={() => setVisible((value) => !value)} hitSlop={10}>
      <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={palette.textMuted} />
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenScroll palette={palette} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          palette={palette}
          eyebrow="Account"
          title="Settings"
          description="Update password and control access to this mobile alumni desk."
          icon="settings-outline"
        />
        <HeroPanel
          palette={palette}
          eyebrow="Security"
          title="Keep your alumni account protected."
          body="Use a strong password and sign out on shared devices."
          icon="lock-closed-outline"
        />

        <Surface palette={palette} style={{ padding: 16, gap: 2 }}>
          <Text style={{ color: palette.text, fontSize: 18, fontWeight: '900', marginBottom: 8 }}>Change password</Text>
          <Field palette={palette} label="Current password" value={currentPw} onChangeText={setCurrentPw} icon="lock-closed-outline" secureTextEntry={!visible} right={visibilityToggle} />
          <Field palette={palette} label="New password" value={newPw} onChangeText={setNewPw} icon="key-outline" secureTextEntry={!visible} />
          <Field palette={palette} label="Confirm new password" value={confirmPw} onChangeText={setConfirmPw} icon="checkmark-done-outline" secureTextEntry={!visible} />
          <PrimaryButton label="Update password" palette={palette} onPress={onChangePassword} loading={submitting} icon="shield-checkmark-outline" />
        </Surface>

        <Surface palette={palette} style={{ padding: 16, marginTop: 18 }}>
          <Text style={{ color: palette.text, fontSize: 16, fontWeight: '900', marginBottom: 4 }}>Appearance</Text>
          <Text style={{ color: palette.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 14 }}>
            Switch the theme. &quot;System&quot; follows your device settings.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {themeOptions.map((opt) => {
              const active = preference === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setPreference(opt.value)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: active ? palette.tint : palette.border,
                    backgroundColor: active ? palette.tint : 'transparent',
                  }}
                >
                  <Ionicons name={opt.icon} size={18} color={active ? palette.background : palette.textMuted} />
                  <Text style={{ color: active ? palette.background : palette.text, fontWeight: '800', fontSize: 13 }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Surface>

        <Surface palette={palette} style={{ padding: 16, marginTop: 18 }}>
          <Text style={{ color: palette.text, fontSize: 16, fontWeight: '900', marginBottom: 4 }}>Session</Text>
          <Text style={{ color: palette.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 14 }}>
            Sign out when you are done using the app on a shared phone.
          </Text>
          <PrimaryButton label="Sign out" palette={palette} onPress={onLogout} icon="log-out-outline" tone="danger" />
        </Surface>
      </ScreenScroll>
    </KeyboardAvoidingView>
  );
}
