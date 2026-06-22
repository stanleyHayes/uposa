import { Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ActionRow, HeroPanel, ScreenHeader, ScreenScroll, Surface } from '@/components/mobile-ui';

interface MoreItem {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  group: 'Community' | 'Support' | 'Account';
}

const ITEMS: MoreItem[] = [
  { label: 'Forum', description: 'Discuss with fellow alumni', icon: 'chatbubbles-outline', href: '/forum', group: 'Community' },
  { label: 'Polls', description: 'Vote on open association questions', icon: 'bar-chart-outline', href: '/polls', group: 'Community' },
  { label: 'Elections', description: 'Cast verified member votes', icon: 'ribbon-outline', href: '/elections', group: 'Community' },
  { label: 'Jobs', description: 'Career opportunities from the network', icon: 'briefcase-outline', href: '/jobs', group: 'Community' },
  { label: 'Mentorship', description: 'Find old students who can guide you', icon: 'hand-left-outline', href: '/mentorship', group: 'Community' },
  { label: 'My dues', description: 'Review dues and settle balances', icon: 'card-outline', href: '/dues', group: 'Support' },
  { label: 'Donations', description: 'Support projects and welfare work', icon: 'heart-outline', href: '/donations', group: 'Support' },
  { label: 'Projects', description: 'Track school-facing initiatives', icon: 'construct-outline', href: '/projects', group: 'Support' },
  { label: 'Contact', description: 'Reach the association desk', icon: 'mail-outline', href: '/contact', group: 'Support' },
  { label: 'Profile', description: 'View your member record', icon: 'person-circle-outline', href: '/(tabs)/profile', group: 'Account' },
  { label: 'Settings', description: 'Password and account controls', icon: 'settings-outline', href: '/settings', group: 'Account' },
];

export default function MoreScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();
  const groups = ['Community', 'Support', 'Account'] as const;

  return (
    <ScreenScroll palette={palette}>
      <ScreenHeader
        palette={palette}
        eyebrow="More"
        title="Alumni lanes"
        description="Everything that sits beyond the main tabs, grouped for quick mobile access."
        icon="apps-outline"
      />

      <HeroPanel
        palette={palette}
        eyebrow="Member tools"
        title="Move through the association from one menu."
        body="Forum, elections, projects, support, contact, and your account controls all live here."
        icon="grid-outline"
      />

      {groups.map((group) => (
        <View key={group} style={{ marginBottom: 16 }}>
          <Surface palette={palette} tone="gold" style={{ padding: 10, marginBottom: 10 }}>
            <Text style={{ color: Brand.navy, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 }}>
              {group.toUpperCase()}
            </Text>
          </Surface>
          {ITEMS.filter((item) => item.group === group).map((item) => (
            <ActionRow
              key={item.label}
              palette={palette}
              icon={item.icon}
              title={item.label}
              description={item.description}
              onPress={() => router.push(item.href)}
            />
          ))}
        </View>
      ))}
    </ScreenScroll>
  );
}
