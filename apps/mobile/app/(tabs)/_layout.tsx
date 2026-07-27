import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppToolbar } from '@/components/app-toolbar';
import { AppDrawer } from '@/components/app-drawer';

export default function TabLayout() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <>
      <Tabs
        screenOptions={{
          header: () => <AppToolbar />,
          headerShown: true,
          tabBarActiveTintColor: palette.tabIconSelected,
          tabBarInactiveTintColor: palette.tabIconDefault,
          tabBarStyle: {
            backgroundColor: palette.background,
            borderTopColor: palette.border,
            borderTopWidth: 1,
            height: 74,
            paddingTop: 8,
            paddingBottom: 10,
          },
          tabBarLabelStyle: { fontSize: 11, fontFamily: Fonts.statusBold },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            title: 'News',
            tabBarIcon: ({ color, size }) => <Ionicons name="newspaper" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="members"
          options={{
            title: 'Members',
            tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
          }}
        />
      </Tabs>
      <AppDrawer />
    </>
  );
}
