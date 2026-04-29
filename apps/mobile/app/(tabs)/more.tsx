import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface MoreItem {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
}

const ITEMS: MoreItem[] = [
  { label: 'Forum', description: 'Discuss with fellow alumni', icon: 'chatbubbles-outline', href: '/forum' },
  { label: 'Polls', description: 'Vote on community polls', icon: 'bar-chart-outline', href: '/polls' },
  { label: 'Elections', description: 'Cast your vote', icon: 'ribbon-outline', href: '/elections' },
  { label: 'Jobs', description: 'Career opportunities', icon: 'briefcase-outline', href: '/jobs' },
  { label: 'Mentorship', description: 'Find or become a mentor', icon: 'people-outline', href: '/mentorship' },
  { label: 'Donations', description: 'Support our work', icon: 'heart-outline', href: '/donations' },
  { label: 'Projects', description: 'Ongoing initiatives', icon: 'construct-outline', href: '/projects' },
  { label: 'Contact', description: 'Reach out to UPOSA', icon: 'mail-outline', href: '/contact' },
  { label: 'Settings', description: 'Account and preferences', icon: 'settings-outline', href: '/settings' },
];

export default function MoreScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.scroll}
    >
      <Text style={[styles.heading, { color: palette.text }]}>Explore more</Text>
      <Text style={[styles.subheading, { color: palette.textMuted }]}>
        Tap any item to dive deeper into the alumni experience.
      </Text>

      <View style={styles.list}>
        {ITEMS.map((item) => (
          <MoreRow
            key={item.label}
            item={item}
            palette={palette}
            onPress={() => router.push(item.href)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function MoreRow({
  item,
  palette,
  onPress,
}: {
  item: MoreItem;
  palette: Palette;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: Brand.cream, borderColor: palette.border }]}>
        <Ionicons name={item.icon} size={20} color={Brand.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: palette.text }]}>{item.label}</Text>
        <Text style={[styles.desc, { color: palette.textMuted }]} numberOfLines={1}>
          {item.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '800' },
  subheading: { fontSize: 13, marginTop: 4, marginBottom: 18 },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: { fontSize: 15, fontWeight: '700' },
  desc: { fontSize: 12, marginTop: 2 },
});
