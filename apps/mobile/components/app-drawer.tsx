import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { Brand, Colors, Fonts, Radii, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDrawerStore } from '@/lib/drawer-store';
import { useAuthStore } from '@/lib/auth-store';

interface DrawerItem {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
}

const GROUPS: { title: string; items: DrawerItem[] }[] = [
  {
    title: 'Community',
    items: [
      { label: 'Forum', description: 'Discuss with fellow alumni', icon: 'chatbubbles-outline', href: '/forum' },
      { label: 'Polls', description: 'Vote on open association questions', icon: 'bar-chart-outline', href: '/polls' },
      { label: 'Elections', description: 'Cast verified member votes', icon: 'ribbon-outline', href: '/elections' },
      { label: 'Jobs', description: 'Career opportunities from the network', icon: 'briefcase-outline', href: '/jobs' },
      { label: 'Mentorship', description: 'Find old students who can guide you', icon: 'hand-left-outline', href: '/mentorship' },
      { label: 'Gallery', description: 'Photos from school and alumni events', icon: 'images-outline', href: '/gallery' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'My dues', description: 'Review dues and settle balances', icon: 'card-outline', href: '/dues' },
      { label: 'Donations', description: 'Support projects and welfare work', icon: 'heart-outline', href: '/donations' },
      { label: 'Projects', description: 'Track school-facing initiatives', icon: 'construct-outline', href: '/projects' },
      { label: 'Requests', description: 'Transcripts and recommendation letters', icon: 'document-text-outline', href: '/requests' },
      { label: 'Contact', description: 'Reach the association desk', icon: 'mail-outline', href: '/contact' },
      { label: 'Help', description: 'Guides for every part of the app', icon: 'help-circle-outline', href: '/help' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Settings', description: 'Password and account controls', icon: 'settings-outline', href: '/settings' },
    ],
  },
];

const DRAWER_WIDTH = 320;

export function AppDrawer() {
  const scheme = useColorScheme() ?? 'light';
  const palette: Palette = Colors[scheme];
  const router = useRouter();
  const isOpen = useDrawerStore((s) => s.isOpen);
  const close = useDrawerStore((s) => s.close);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [mounted, setMounted] = useState(false);
  const [slide] = useState(() => new Animated.Value(-DRAWER_WIDTH));
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(slide, { toValue: 0, duration: 240, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(slide, { toValue: -DRAWER_WIDTH, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [isOpen, mounted, slide, fade]);

  const go = (href: Href) => {
    close();
    router.push(href);
  };

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>
        <Animated.View
          style={[
            styles.drawer,
            { backgroundColor: palette.background, borderRightColor: palette.border, transform: [{ translateX: slide }] },
          ]}
        >
          <View style={[styles.header, { backgroundColor: Brand.navy, borderBottomColor: palette.border }]}>
            <View style={styles.headerRow}>
              <Image source={require('../assets/images/logo.png')} style={styles.headerLogo} contentFit="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>UPOSA Alumni</Text>
                <Text style={styles.headerSub}>{user?.fullName ?? 'Member tools'}</Text>
              </View>
              <Pressable onPress={close} hitSlop={10}>
                <Ionicons name="close" size={22} color={Brand.cream} />
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {GROUPS.map((group) => (
              <View key={group.title} style={styles.group}>
                <Text style={[styles.groupTitle, { color: Brand.gold }]}>{group.title.toUpperCase()}</Text>
                {group.items.map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={() => go(item.href)}
                    style={({ pressed }) => [styles.item, { borderBottomColor: palette.border }, pressed && { opacity: 0.72 }]}
                  >
                    <View style={[styles.itemIcon, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                      <Ionicons name={item.icon} size={17} color={palette.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemLabel, { color: palette.text }]}>{item.label}</Text>
                      <Text style={[styles.itemDesc, { color: palette.textMuted }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={palette.textMuted} />
                  </Pressable>
                ))}
              </View>
            ))}

            <Pressable
              onPress={() => {
                close();
                logout();
              }}
              style={({ pressed }) => [styles.signOut, { borderColor: palette.danger }, pressed && { opacity: 0.72 }]}
            >
              <Ionicons name="log-out-outline" size={17} color={palette.danger} />
              <Text style={[styles.signOutText, { color: palette.danger }]}>Sign out</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,15,48,0.5)' },
  drawer: { width: DRAWER_WIDTH, maxWidth: '84%', borderRightWidth: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerLogo: { width: 42, height: 42 },
  headerTitle: { color: Brand.cream, fontSize: 18, fontFamily: Fonts.displayHeavy },
  headerSub: { color: 'rgba(255,248,220,0.72)', fontSize: 12, fontFamily: Fonts.body, marginTop: 2 },
  group: { marginTop: 14 },
  groupTitle: { fontSize: 11, fontFamily: Fonts.statusBold, letterSpacing: 1.6, paddingHorizontal: 16, marginBottom: 6 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemIcon: { width: 34, height: 34, borderWidth: 1, ...Radii.tile, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 14, fontFamily: Fonts.bodySemiBold },
  itemDesc: { fontSize: 11, fontFamily: Fonts.body, marginTop: 1 },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 22,
    paddingVertical: 12,
    borderWidth: 1,
    ...Radii.button,
  },
  signOutText: { fontSize: 14, fontFamily: Fonts.statusBold },
});
