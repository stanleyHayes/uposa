import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { mentorshipApi } from '@/lib/api';
import type { Member } from '@/lib/types';

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

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={styles.list}
        data={mentors}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Ionicons name="people-outline" size={36} color={palette.textMuted} />
            <Text style={{ color: palette.textMuted }}>No mentors are available right now.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelected(item)}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: Brand.navy }]}>
                <Text style={[styles.avatarLetter, { color: Brand.gold }]}>
                  {item.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: palette.text }]}>{item.fullName}</Text>
              <Text style={[styles.subtitle, { color: palette.textMuted }]} numberOfLines={1}>
                {[item.occupation, item.organization].filter(Boolean).join(' · ') || 'Mentor'}
              </Text>
              {item.mentorBio ? (
                <Text style={[styles.bio, { color: palette.textMuted }]} numberOfLines={2}>
                  {item.mentorBio}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
          </Pressable>
        )}
      />

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Request mentorship</Text>
              <Pressable onPress={() => setSelected(null)} hitSlop={10}>
                <Ionicons name="close" size={22} color={palette.textMuted} />
              </Pressable>
            </View>
            {selected ? (
              <Text style={[styles.modalSub, { color: palette.textMuted }]}>
                Send a brief message to {selected.fullName}.
              </Text>
            ) : null}
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="What do you hope to learn?"
              placeholderTextColor={palette.textMuted}
              multiline
              style={[
                styles.modalInput,
                { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
              ]}
            />
            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: Brand.navy, opacity: pressed || submitting ? 0.85 : 1 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={Brand.cream} />
              ) : (
                <Text style={styles.btnText}>Send request</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 20, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  bio: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  empty: {
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalSub: { fontSize: 13 },
  modalInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  btn: {
    marginTop: 12,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: Brand.cream, fontWeight: '700', fontSize: 15 },
});
