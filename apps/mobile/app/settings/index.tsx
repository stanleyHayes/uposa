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
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const logout = useAuthStore((s) => s.logout);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
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
      Alert.alert('Passwords don’t match', 'Re-enter your new password to confirm.');
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
    Alert.alert('Sign out?', 'You’ll need to sign in again to access your account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Change password</Text>

          <PwField label="Current password" value={currentPw} onChangeText={setCurrentPw} palette={palette} />
          <PwField label="New password" value={newPw} onChangeText={setNewPw} palette={palette} />
          <PwField label="Confirm new password" value={confirmPw} onChangeText={setConfirmPw} palette={palette} />

          <Pressable
            onPress={onChangePassword}
            disabled={submitting}
            style={({ pressed }) => [
              styles.btnPrimary,
              { backgroundColor: Brand.navy, opacity: pressed || submitting ? 0.85 : 1 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={Brand.cream} />
            ) : (
              <Text style={styles.btnPrimaryText}>Update password</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={palette.danger} />
          <Text style={[styles.logoutText, { color: palette.danger }]}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PwField({
  label,
  value,
  onChangeText,
  palette,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  palette: typeof Colors.light;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <View style={[styles.inputWrap, { borderColor: palette.border, backgroundColor: palette.background }]}>
        <Ionicons name="lock-closed-outline" size={18} color={palette.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { color: palette.text }]}
          placeholderTextColor={palette.textMuted}
        />
        <Pressable onPress={() => setVisible((v) => !v)} hitSlop={10}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={palette.textMuted} />
        </Pressable>
      </View>
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
    gap: 4,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  field: { marginBottom: 12 },
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
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: Brand.cream, fontSize: 16, fontWeight: '700' },
  logoutBtn: {
    marginTop: 24,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
});
