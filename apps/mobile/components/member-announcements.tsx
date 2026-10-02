import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Fonts, type Palette } from '@/constants/theme';
import type { Announcement, AnnouncementType } from '@/lib/types';
import { MarkdownBody } from '@/components/markdown';
import { Surface } from '@/components/mobile-ui';

const DISMISSED_KEY = 'uposa_alumni_dismissed_announcements';
const MAX_SHOWN = 3;

type IconName = ComponentProps<typeof Ionicons>['name'];

function toneFor(type: AnnouncementType, palette: Palette): { icon: IconName; color: string } {
  switch (type) {
    case 'URGENT':
      return { icon: 'alert-circle', color: palette.danger };
    case 'WARNING':
      return { icon: 'warning', color: Brand.gold };
    case 'SUCCESS':
      return { icon: 'checkmark-circle', color: palette.success };
    default:
      return { icon: 'information-circle', color: palette.tint };
  }
}

/** Latest member announcements, compact and dismissible (dismissals persist per device). */
export function MemberAnnouncements({ palette, items }: { palette: Palette; items: Announcement[] }) {
  // null until the stored dismissals load, so dismissed items never flash in.
  const [dismissed, setDismissed] = useState<string[] | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY)
      .then((raw) => {
        const value: unknown = JSON.parse(raw ?? '[]');
        setDismissed(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []);
      })
      .catch(() => setDismissed([]));
  }, []);

  if (!dismissed) return null;
  const visible = [...items]
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .filter((item) => !dismissed.includes(item.id))
    .slice(0, MAX_SHOWN);
  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    // Keep only ids that are still being served so the stored list can't grow forever.
    const next = [...dismissed.filter((existing) => items.some((item) => item.id === existing)), id];
    setDismissed(next);
    AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(next)).catch(() => {});
  };

  return (
    <View style={{ gap: 10, marginBottom: 12 }}>
      {visible.map((item) => {
        const tone = toneFor(item.type, palette);
        return (
          <Surface key={item.id} palette={palette} style={{ padding: 14, borderLeftWidth: 3, borderLeftColor: tone.color }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <Ionicons name={tone.icon} size={18} color={tone.color} style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, color: palette.text, fontSize: 15, lineHeight: 21, fontFamily: Fonts.bodyBold }}>{item.title}</Text>
              <Pressable
                onPress={() => dismiss(item.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Dismiss announcement: ${item.title}`}
              >
                <Ionicons name="close" size={18} color={palette.textMuted} />
              </Pressable>
            </View>
            <View style={{ marginTop: 6 }}>
              <MarkdownBody palette={palette}>{item.body}</MarkdownBody>
            </View>
          </Surface>
        );
      })}
    </View>
  );
}
