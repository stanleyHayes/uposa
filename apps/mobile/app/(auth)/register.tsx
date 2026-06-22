import { Linking, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Constants from 'expo-constants';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ActionRow, HeroPanel, PrimaryButton, ScreenScroll, Surface } from '@/components/mobile-ui';

const WEB_URL =
  (Constants.expoConfig?.extra as { webUrl?: string } | undefined)?.webUrl ||
  'https://uposa.org';

export default function RegisterScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <ScreenScroll palette={palette} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <HeroPanel
        palette={palette}
        eyebrow="Join the network"
        title="Start registration on the full alumni portal."
        body="The web form captures your profile, year group, programme, contact details, and approval information."
        icon="person-add-outline"
      />

      <Surface palette={palette} style={{ padding: 16, gap: 10 }}>
        <ActionRow
          palette={palette}
          icon="checkmark-done-outline"
          title="Complete the full form"
          description="Use the web portal for the longer registration flow and photo upload."
        />
        <ActionRow
          palette={palette}
          icon="shield-checkmark-outline"
          title="Wait for approval"
          description="Executives verify member details before app access is active."
        />
        <ActionRow
          palette={palette}
          icon="phone-portrait-outline"
          title="Return to this app"
          description="Once approved, sign in here for dues, events, directory, and community tools."
        />

        <PrimaryButton
          label="Open web registration"
          palette={palette}
          onPress={() => Linking.openURL(`${WEB_URL}/register`)}
          icon="open-outline"
        />

        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <Link href="/(auth)/login" asChild>
            <Pressable hitSlop={8}>
              <Text style={{ color: palette.textMuted, fontSize: 14 }}>
                Already approved? <Text style={{ color: Brand.gold, fontWeight: '900' }}>Sign in</Text>
              </Text>
            </Pressable>
          </Link>
        </View>
      </Surface>
    </ScreenScroll>
  );
}
