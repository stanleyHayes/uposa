import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors, Fonts, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useThemePreference, type ThemePreference } from '@/lib/theme-context';
import { Field, HeroPanel, PrimaryButton, ScreenHeader, ScreenScroll, Surface } from '@/components/mobile-ui';

const NOTIFICATIONS_KEY = 'uposa_mobile_notifications';
const PRIVACY_KEY = 'uposa_mobile_privacy';

const NOTIFICATION_OPTIONS = [
  { key: 'emailEvents', label: 'Events & gatherings', desc: 'Upcoming events and RSVP updates' },
  { key: 'emailNews', label: 'News & announcements', desc: 'Latest UPOSA news and notices' },
  { key: 'emailForum', label: 'Forum replies', desc: 'Replies to your forum posts' },
  { key: 'emailPolls', label: 'Polls & elections', desc: 'New votes and ballot windows' },
  { key: 'emailDues', label: 'Dues reminders', desc: 'Outstanding dues and payment prompts' },
  { key: 'emailMentorship', label: 'Mentorship requests', desc: 'Mentorship activity and responses' },
] as const;

const PRIVACY_OPTIONS = [
  { key: 'showInDirectory', label: 'Show in alumni directory', desc: 'Allow members to find you in directory search' },
  { key: 'showEmail', label: 'Show email address', desc: 'Display your email on your public profile' },
  { key: 'showPhone', label: 'Show phone number', desc: 'Display your phone number on your public profile' },
  { key: 'showYearGroup', label: 'Show year group', desc: 'Display your year group on your profile' },
] as const;

type ToggleMap = Record<string, boolean>;

function ToggleRow({
  palette,
  label,
  description,
  value,
  onValueChange,
}: {
  palette: (typeof Colors)['light'];
  label: string;
  description: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.text, fontSize: 14, fontFamily: Fonts.bodySemiBold }}>{label}</Text>
        <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body, lineHeight: 17, marginTop: 2 }}>
          {description}
        </Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: palette.tint }} thumbColor={value ? palette.accent : undefined} />
    </View>
  );
}

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
  const [notifications, setNotifications] = useState<ToggleMap>(() =>
    Object.fromEntries(NOTIFICATION_OPTIONS.map((o) => [o.key, true]))
  );
  const [privacy, setPrivacy] = useState<ToggleMap>(() =>
    Object.fromEntries(PRIVACY_OPTIONS.map((o) => [o.key, true]))
  );

  useEffect(() => {
    (async () => {
      try {
        const [savedNotifications, savedPrivacy] = await Promise.all([
          AsyncStorage.getItem(NOTIFICATIONS_KEY),
          AsyncStorage.getItem(PRIVACY_KEY),
        ]);
        if (savedNotifications) setNotifications((prev) => ({ ...prev, ...JSON.parse(savedNotifications) }));
        if (savedPrivacy) setPrivacy((prev) => ({ ...prev, ...JSON.parse(savedPrivacy) }));
      } catch {
        // keep defaults
      }
    })();
  }, []);

  const toggleNotification = (key: string, next: boolean) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: next };
      AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const togglePrivacy = (key: string, next: boolean) => {
    setPrivacy((prev) => {
      const updated = { ...prev, [key]: next };
      AsyncStorage.setItem(PRIVACY_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

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
    logout();
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
          <Text style={{ color: palette.text, fontSize: 18, fontFamily: Fonts.display, marginBottom: 8 }}>Change password</Text>
          <Field palette={palette} label="Current password" value={currentPw} onChangeText={setCurrentPw} icon="lock-closed-outline" secureTextEntry={!visible} right={visibilityToggle} />
          <Field palette={palette} label="New password" value={newPw} onChangeText={setNewPw} icon="key-outline" secureTextEntry={!visible} />
          <Field palette={palette} label="Confirm new password" value={confirmPw} onChangeText={setConfirmPw} icon="checkmark-done-outline" secureTextEntry={!visible} />
          <PrimaryButton label="Update password" palette={palette} onPress={onChangePassword} loading={submitting} icon="shield-checkmark-outline" />
        </Surface>

        <Surface palette={palette} style={{ padding: 16, marginTop: 18 }}>
          <Text style={{ color: palette.text, fontSize: 16, fontFamily: Fonts.display, marginBottom: 4 }}>Appearance</Text>
          <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19, marginBottom: 14 }}>
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
                    ...Radii.tile,
                  }}
                >
                  <Ionicons name={opt.icon} size={18} color={active ? palette.background : palette.textMuted} />
                  <Text style={{ color: active ? palette.background : palette.text, fontFamily: Fonts.statusBold, fontSize: 13 }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Surface>

        <Surface palette={palette} style={{ padding: 16, marginTop: 18 }}>
          <Text style={{ color: palette.text, fontSize: 16, fontFamily: Fonts.display, marginBottom: 4 }}>Notifications</Text>
          <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19, marginBottom: 6 }}>
            Choose which association updates should reach your inbox.
          </Text>
          {NOTIFICATION_OPTIONS.map((opt) => (
            <ToggleRow
              key={opt.key}
              palette={palette}
              label={opt.label}
              description={opt.desc}
              value={!!notifications[opt.key]}
              onValueChange={(next) => toggleNotification(opt.key, next)}
            />
          ))}
        </Surface>

        <Surface palette={palette} style={{ padding: 16, marginTop: 18 }}>
          <Text style={{ color: palette.text, fontSize: 16, fontFamily: Fonts.display, marginBottom: 4 }}>Privacy</Text>
          <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19, marginBottom: 6 }}>
            Control what other alumni can see when they view your member profile.
          </Text>
          {PRIVACY_OPTIONS.map((opt) => (
            <ToggleRow
              key={opt.key}
              palette={palette}
              label={opt.label}
              description={opt.desc}
              value={!!privacy[opt.key]}
              onValueChange={(next) => togglePrivacy(opt.key, next)}
            />
          ))}
        </Surface>

        <Surface palette={palette} style={{ padding: 16, marginTop: 18 }}>
          <Text style={{ color: palette.text, fontSize: 16, fontFamily: Fonts.display, marginBottom: 4 }}>Session</Text>
          <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19, marginBottom: 14 }}>
            Sign out when you are done using the app on a shared phone.
          </Text>
          <PrimaryButton label="Sign out" palette={palette} onPress={onLogout} icon="log-out-outline" tone="danger" />
        </Surface>
      </ScreenScroll>
    </KeyboardAvoidingView>
  );
}
