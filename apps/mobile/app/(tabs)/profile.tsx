import { Alert, Text, View } from 'react-native';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/auth-store';
import {
  AvatarMark,
  DetailRow,
  HeroPanel,
  Pill,
  PrimaryButton,
  ScreenHeader,
  ScreenScroll,
  SectionTitle,
  Surface,
} from '@/components/mobile-ui';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const onLogout = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to access your account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (!user) return null;

  return (
    <ScreenScroll palette={palette}>
      <ScreenHeader
        palette={palette}
        eyebrow="Member profile"
        title={user.fullName}
        description={user.email}
        right={<AvatarMark palette={palette} name={user.fullName} photoUrl={user.photoUrl} size={58} />}
      />

      <HeroPanel
        palette={palette}
        eyebrow={user.membershipStatus}
        title={user.isApproved === false ? 'Approval still pending' : 'Your alumni record is active'}
        body="Keep your professional, year-group, and contact details current so the directory stays useful."
        icon="shield-checkmark-outline"
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {user.yearGroup ? <Pill palette={palette} tone="gold">Class of {user.yearGroup}</Pill> : null}
          {user.house ? <Pill palette={palette} tone="navy">{user.house} House</Pill> : null}
          {user.isAvailableAsMentor ? <Pill palette={palette} tone="gold">Mentor</Pill> : null}
        </View>
      </HeroPanel>

      <SectionTitle palette={palette} title="Profile snapshot" />
      <View style={{ gap: 10 }}>
        <Surface palette={palette} style={{ padding: 14 }}>
          <Text style={{ color: Brand.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 }}>WORK</Text>
          <Text style={{ color: palette.text, fontSize: 18, fontWeight: '900', marginTop: 8 }}>
            {user.occupation || 'Occupation not set'}
          </Text>
          <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 3 }}>
            {user.organization || 'Organization not set'}
          </Text>
        </Surface>
        <DetailRow palette={palette} icon="school-outline" label="Programme" value={user.programme ?? 'Not set'} />
        <DetailRow palette={palette} icon="call-outline" label="Phone" value={user.mobileNumber ?? 'Not set'} />
        <DetailRow
          palette={palette}
          icon="location-outline"
          label="Location"
          value={[user.city, user.region, user.country].filter(Boolean).join(', ') || 'Not set'}
        />
        <DetailRow palette={palette} icon="people-outline" label="Mentor availability" value={user.isAvailableAsMentor ? 'Available' : 'Not available'} />
      </View>

      <SectionTitle palette={palette} title="Membership" />
      <Surface palette={palette} style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.textMuted, fontSize: 11, fontWeight: '800' }}>STATUS</Text>
            <Text style={{ color: palette.text, fontSize: 16, fontWeight: '900', marginTop: 4 }}>{user.membershipStatus}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.textMuted, fontSize: 11, fontWeight: '800' }}>VERIFICATION</Text>
            <Text style={{ color: palette.text, fontSize: 16, fontWeight: '900', marginTop: 4 }}>
              {user.isVerified ? 'Verified' : 'Pending'}
            </Text>
          </View>
        </View>
      </Surface>

      <View style={{ marginTop: 22 }}>
        <PrimaryButton label="Sign out" palette={palette} onPress={onLogout} icon="log-out-outline" tone="danger" />
      </View>
    </ScreenScroll>
  );
}
