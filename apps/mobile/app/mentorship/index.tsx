import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { mentorshipApi } from '@/lib/api';
import type { Member } from '@/lib/types';
import {
  AvatarMark,
  EmptyState,
  Field,
  LoadingState,
  Pill,
  PrimaryButton,
  ScreenHeader,
  Surface,
} from '@/components/mobile-ui';

export default function MentorshipScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [mentors, setMentors] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await mentorshipApi.mentors({ limit: 50 });
      setMentors(res.data.data ?? []);
    } catch {
      setMentors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await mentorshipApi.request({ mentorId: selected.id, message: message.trim() || undefined });
      Alert.alert('Request sent', `${selected.fullName} will be notified.`);
      setSelected(null);
      setMessage('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not send request.';
      Alert.alert('Request failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState palette={palette} title="Mentorship" />;

  return (
    <>
      <FlatList
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        data={mentors}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
        ListHeaderComponent={
          <ScreenHeader
            palette={palette}
            eyebrow="Guidance"
            title="Mentorship"
            description="Connect with old students who can guide professional, academic, and life decisions."
            icon="people-outline"
          />
        }
        ListEmptyComponent={
          <EmptyState palette={palette} icon="people-outline" title="Mentor profiles are coming soon" description="Registered alumni can opt in from their profile or membership desk." />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelected(item)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
            <Surface palette={palette} style={{ padding: 12, flexDirection: 'row', gap: 12 }}>
              <AvatarMark palette={palette} name={item.fullName} photoUrl={item.photoUrl} />
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={{ color: palette.text, fontSize: 16, fontWeight: '900' }}>{item.fullName}</Text>
                <Text style={{ color: palette.textMuted, fontSize: 12 }} numberOfLines={1}>
                  {[item.occupation, item.organization].filter(Boolean).join(' · ') || 'Mentor'}
                </Text>
                {item.mentorBio ? (
                  <Text style={{ color: palette.textMuted, fontSize: 12, lineHeight: 18 }} numberOfLines={2}>
                    {item.mentorBio}
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {(item.areaOfExpertise ?? []).slice(0, 2).map((tag) => <Pill key={tag} palette={palette}>{tag}</Pill>)}
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color={palette.textMuted} />
            </Surface>
          </Pressable>
        )}
      />

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Surface palette={palette} style={{ padding: 18, borderBottomWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: palette.text, fontSize: 18, fontWeight: '900' }}>Request mentorship</Text>
                <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 3 }} numberOfLines={1}>
                  {selected ? `Send a note to ${selected.fullName}` : ''}
                </Text>
              </View>
              <Pressable onPress={() => setSelected(null)} hitSlop={10}>
                <Ionicons name="close" size={24} color={palette.textMuted} />
              </Pressable>
            </View>
            <Field
              palette={palette}
              label="Message"
              value={message}
              onChangeText={setMessage}
              placeholder="What do you hope to learn?"
              icon="create-outline"
              multiline
            />
            <PrimaryButton label="Send request" palette={palette} onPress={onSubmit} loading={submitting} icon="send-outline" />
          </Surface>
        </View>
      </Modal>
    </>
  );
}
