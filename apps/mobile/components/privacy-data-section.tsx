import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { Fonts, type Palette } from '@/constants/theme';
import { authApi, membersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { ACCOUNT_DELETION_URL, PRIVACY_URL, TERMS_URL, openLegalPage } from '@/lib/legal';
import type { Member, MemberPreferences } from '@/lib/types';
import { Field, PrimaryButton, Surface } from '@/components/mobile-ui';

// Same defaults as the API for accounts that predate consent records.
const DEFAULT_PREFERENCES: MemberPreferences = { marketingOptIn: false, directoryOptIn: true };

function errorMessage(err: unknown): string | undefined {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === 'string') {
    try {
      return (JSON.parse(data) as { message?: string }).message;
    } catch {
      return undefined;
    }
  }
  return (data as { message?: string } | undefined)?.message;
}

function PreferenceRow({
  palette,
  label,
  description,
  value,
  disabled,
  onValueChange,
}: {
  palette: Palette;
  label: string;
  description: string;
  value: boolean;
  disabled: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.border }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.text, fontSize: 14, fontFamily: Fonts.bodySemiBold }}>{label}</Text>
        <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body, lineHeight: 17, marginTop: 2 }}>{description}</Text>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ true: palette.tint }}
        thumbColor={value ? palette.accent : undefined}
        accessibilityLabel={label}
      />
    </View>
  );
}

/**
 * Settings → Privacy & data (Ghana Data Protection Act 2012, Act 843; Apple
 * 5.1.1(v); Google Play account deletion): consent choices, a copy of the
 * member's data, and in-app account deletion.
 */
export function PrivacyDataSection({ palette }: { palette: Palette }) {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);
  const [saving, setSaving] = useState<keyof MemberPreferences | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const preferences = user?.preferences ?? DEFAULT_PREFERENCES;

  // Members signed in before preferences existed have none cached: read the current values.
  useEffect(() => {
    let active = true;
    authApi
      .me()
      .then((res) => {
        // /auth/me wraps the member as { type, data }.
        const payload = res.data.data as unknown as (Partial<Member> & { data?: Member }) | undefined;
        const fresh = payload?.data?.preferences ?? payload?.preferences;
        if (active && fresh) updateUser({ preferences: fresh });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [updateUser]);

  const setPreference = async (key: keyof MemberPreferences, value: boolean) => {
    const previous = preferences;
    updateUser({ preferences: { ...previous, [key]: value } });
    setSaving(key);
    try {
      const res = await membersApi.updatePreferences({ [key]: value });
      if (res.data.data) updateUser({ preferences: res.data.data });
    } catch (err) {
      updateUser({ preferences: previous });
      Alert.alert('Not saved', errorMessage(err) || 'Could not save your preference. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const downloadData = async () => {
    if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) {
      Alert.alert('Download unavailable', 'Download your data from Settings in the UPOSA alumni web portal instead.');
      return;
    }
    setExporting(true);
    let file: File | null = null;
    try {
      const res = await membersApi.exportMyData();
      const disposition = String(res.headers['content-disposition'] ?? '');
      const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] || `uposa-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      file = new File(Paths.cache, name);
      file.create({ overwrite: true });
      file.write(res.data);
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Save your UPOSA data' });
    } catch (err) {
      Alert.alert('Export failed', errorMessage(err) || 'Could not export your data. Please try again.');
    } finally {
      // Personal data should not linger in the cache once it has been handed off.
      try {
        if (file?.exists) file.delete();
      } catch {
        // the OS clears the cache directory eventually
      }
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await membersApi.deleteMyAccount(password);
      Alert.alert('Account deleted', 'Your UPOSA account has been deleted and you have been signed out.');
      await logout();
    } catch (err) {
      setDeleteError(errorMessage(err) || 'Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (!password) {
      setDeleteError('Enter your password to confirm.');
      return;
    }
    Alert.alert('Delete your account?', 'This permanently deletes your account and signs you out. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete account', style: 'destructive', onPress: () => void deleteAccount() },
    ]);
  };

  const muted = { color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19 } as const;

  return (
    <Surface palette={palette} style={{ padding: 16, marginTop: 18 }}>
      <Text style={{ color: palette.text, fontSize: 16, fontFamily: Fonts.display, marginBottom: 4 }}>Privacy & data</Text>
      <Text style={[muted, { marginBottom: 6 }]}>
        Choose who can find you and what we email you, download a copy of your data, or delete your account.
      </Text>

      <PreferenceRow
        palette={palette}
        label="Show my profile in the member directory"
        description="Signed-in members can find you in directory search."
        value={preferences.directoryOptIn}
        disabled={saving === 'directoryOptIn'}
        onValueChange={(next) => setPreference('directoryOptIn', next)}
      />
      <PreferenceRow
        palette={palette}
        label="Email me UPOSA news and updates"
        description="Newsletters and association news. Account and payment emails still arrive."
        value={preferences.marketingOptIn}
        disabled={saving === 'marketingOptIn'}
        onValueChange={(next) => setPreference('marketingOptIn', next)}
      />

      <View style={{ marginTop: 16, gap: 8 }}>
        <Text style={{ color: palette.text, fontSize: 14, fontFamily: Fonts.bodySemiBold }}>Download my data</Text>
        <Text style={muted}>
          A JSON file with your profile, consents, dues, donations, payments, event RSVPs, mentorship, jobs, forum posts and votes.
        </Text>
        <PrimaryButton label="Download my data" palette={palette} onPress={downloadData} loading={exporting} icon="download-outline" tone="outline" />
      </View>

      <View style={{ marginTop: 18, gap: 8, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 14 }}>
        <Text style={{ color: palette.danger, fontSize: 14, fontFamily: Fonts.bodyBold }}>Delete account</Text>
        <Text style={muted}>
          <Text style={{ fontFamily: Fonts.bodySemiBold, color: palette.text }}>Deleted: </Text>
          your profile details and photo, your sign-in, job posts and applications, mentorship requests, event RSVPs and newsletter subscription.
        </Text>
        <Text style={muted}>
          <Text style={{ fontFamily: Fonts.bodySemiBold, color: palette.text }}>Kept without your personal details: </Text>
          dues, donation and payment records (the association must keep these for its accounts), anonymous poll and election
          participation, and your forum posts and comments, which will show as &quot;Deleted member&quot;. This cannot be undone.
        </Text>
        {deleteOpen ? (
          <View>
            <Field
              palette={palette}
              label="Enter your password to confirm"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setDeleteError('');
              }}
              icon="lock-closed-outline"
              secureTextEntry
            />
            {deleteError ? (
              <Text style={{ color: palette.danger, fontSize: 12, fontFamily: Fonts.body, marginBottom: 8 }}>{deleteError}</Text>
            ) : null}
            <View style={{ gap: 8 }}>
              <PrimaryButton label="Delete my account" palette={palette} onPress={confirmDelete} loading={deleting} icon="trash-outline" tone="danger" />
              <PrimaryButton
                label="Cancel"
                palette={palette}
                onPress={() => {
                  setDeleteOpen(false);
                  setPassword('');
                  setDeleteError('');
                }}
                tone="outline"
                disabled={deleting}
              />
            </View>
          </View>
        ) : (
          <PrimaryButton label="Delete account" palette={palette} onPress={() => setDeleteOpen(true)} icon="trash-outline" tone="danger" />
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
        {[
          { url: PRIVACY_URL, label: 'Privacy Policy' },
          { url: TERMS_URL, label: 'Terms of Use' },
          { url: ACCOUNT_DELETION_URL, label: 'Account deletion help' },
        ].map((item) => (
          <Pressable key={item.url} onPress={() => openLegalPage(item.url)} accessibilityRole="link" hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: palette.tint, fontSize: 13, fontFamily: Fonts.bodySemiBold }}>{item.label}</Text>
            <Ionicons name="open-outline" size={13} color={palette.tint} />
          </Pressable>
        ))}
      </View>
    </Surface>
  );
}
