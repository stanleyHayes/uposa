import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, RefreshControl, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { mentorshipApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { Member, MentorshipRequest, MentorshipRequestStatus } from '@/lib/types';
import {
  AvatarMark,
  EmptyState,
  Field,
  LoadingState,
  Pill,
  PrimaryButton,
  ScreenHeader,
  Surface,
  formatShortDate,
} from '@/components/mobile-ui';

type Tab = 'mentors' | 'requests' | 'mentees';

const TABS: { key: Tab; label: string }[] = [
  { key: 'mentors', label: 'Mentors' },
  { key: 'requests', label: 'My Requests' },
  { key: 'mentees', label: 'My Mentees' },
];

function statusTone(status: MentorshipRequestStatus): 'muted' | 'gold' | 'navy' {
  if (status === 'PENDING') return 'gold';
  if (status === 'ACCEPTED') return 'navy';
  return 'muted';
}

export default function MentorshipScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [tab, setTab] = useState<Tab>('mentors');
  const [mentors, setMentors] = useState<Member[]>([]);
  const [myRequests, setMyRequests] = useState<MentorshipRequest[]>([]);
  const [myMentees, setMyMentees] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const [available, setAvailable] = useState(user?.isAvailableAsMentor ?? false);
  const [bio, setBio] = useState(user?.mentorBio ?? '');
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  const [selected, setSelected] = useState<Member | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [respondingTo, setRespondingTo] = useState<MentorshipRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [responding, setResponding] = useState(false);

  const load = useCallback(async () => {
    const [mentorsRes, requestsRes, menteesRes, profileRes] = await Promise.allSettled([
      mentorshipApi.mentors({ limit: 50 }),
      mentorshipApi.myRequests(),
      mentorshipApi.myMentees(),
      mentorshipApi.myProfile(),
    ]);
    setMentors(mentorsRes.status === 'fulfilled' ? mentorsRes.value.data.data ?? [] : []);
    setMyRequests(requestsRes.status === 'fulfilled' ? requestsRes.value.data.data ?? [] : []);
    setMyMentees(menteesRes.status === 'fulfilled' ? menteesRes.value.data.data ?? [] : []);
    const profile = profileRes.status === 'fulfilled' ? profileRes.value.data.data : null;
    setAvailable(profile?.isAvailableAsMentor ?? user?.isAvailableAsMentor ?? false);
    setBio(profile?.mentorBio ?? user?.mentorBio ?? '');
    setLoading(false);
  }, [user?.isAvailableAsMentor, user?.mentorBio]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filteredMentors = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mentors;
    return mentors.filter((mentor) =>
      mentor.fullName.toLowerCase().includes(q)
      || mentor.occupation?.toLowerCase().includes(q)
      || mentor.organization?.toLowerCase().includes(q)
      || (mentor.areaOfExpertise ?? []).some((area) => area.toLowerCase().includes(q)));
  }, [mentors, query]);

  const onToggleAvailability = async (next: boolean) => {
    setAvailable(next);
    setSavingAvailability(true);
    try {
      await mentorshipApi.setAvailability({ isAvailableAsMentor: next, mentorBio: bio.trim() || undefined });
      updateUser({ isAvailableAsMentor: next });
    } catch (err: any) {
      setAvailable(!next);
      const msg = err?.response?.data?.message || 'Could not update availability.';
      Alert.alert('Update failed', msg);
    } finally {
      setSavingAvailability(false);
    }
  };

  const onSaveBio = async () => {
    setSavingBio(true);
    try {
      await mentorshipApi.setAvailability({ isAvailableAsMentor: available, mentorBio: bio.trim() || undefined });
      updateUser({ mentorBio: bio.trim() });
      Alert.alert('Saved', 'Your mentor bio has been updated.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not save your bio.';
      Alert.alert('Save failed', msg);
    } finally {
      setSavingBio(false);
    }
  };

  const onSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await mentorshipApi.request({ mentorId: selected.id, message: message.trim() || undefined });
      Alert.alert('Request sent', `${selected.fullName} will be notified.`);
      setSelected(null);
      setMessage('');
      const res = await mentorshipApi.myRequests();
      setMyRequests(res.data.data ?? []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not send request.';
      Alert.alert('Request failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRespond = async (status: 'ACCEPTED' | 'DECLINED') => {
    if (!respondingTo) return;
    setResponding(true);
    try {
      await mentorshipApi.respond(respondingTo.id, { status, mentorResponse: responseMessage.trim() || undefined });
      setRespondingTo(null);
      setResponseMessage('');
      const res = await mentorshipApi.myMentees();
      setMyMentees(res.data.data ?? []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not respond to the request.';
      Alert.alert('Response failed', msg);
    } finally {
      setResponding(false);
    }
  };

  const renderMessageBox = (label: string, body: string) => (
    <View style={{ backgroundColor: palette.surfaceMuted, padding: 10, gap: 3 }}>
      <Text style={{ color: palette.accent, fontSize: 10, fontFamily: Fonts.statusBold, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ color: palette.text, fontSize: 13, fontFamily: Fonts.body, lineHeight: 18 }}>{body}</Text>
    </View>
  );

  const renderMentor = (item: Member) => (
    <Pressable onPress={() => setSelected(item)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
      <Surface palette={palette} style={{ padding: 12, flexDirection: 'row', gap: 12 }}>
        <AvatarMark palette={palette} name={item.fullName} photoUrl={item.photoUrl} />
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={{ color: palette.text, fontSize: 16, fontFamily: Fonts.bodyBold }}>{item.fullName}</Text>
          <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body }} numberOfLines={1}>
            {[item.occupation, item.organization].filter(Boolean).join(' · ') || 'Mentor'}
          </Text>
          {item.mentorBio ? (
            <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body, lineHeight: 18 }} numberOfLines={2}>
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
  );

  const renderRequest = (item: MentorshipRequest, direction: 'outgoing' | 'incoming') => {
    const person = direction === 'outgoing' ? item.mentor : item.mentee;
    return (
      <Surface palette={palette} style={{ padding: 12, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <AvatarMark palette={palette} name={person?.fullName ?? 'Member'} photoUrl={person?.photoUrl} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: palette.text, fontSize: 16, fontFamily: Fonts.bodyBold }} numberOfLines={1}>
              {person?.fullName ?? 'Unknown member'}
            </Text>
            <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body }} numberOfLines={1}>
              {formatShortDate(item.createdAt)}
            </Text>
          </View>
          <Pill palette={palette} tone={statusTone(item.status)}>{item.status}</Pill>
        </View>
        {item.message ? renderMessageBox(direction === 'incoming' ? 'Request message' : 'Your message', item.message) : null}
        {item.mentorResponse ? renderMessageBox('Mentor response', item.mentorResponse) : null}
        {direction === 'incoming' && item.status === 'PENDING' ? (
          <PrimaryButton
            label="Respond"
            palette={palette}
            tone="outline"
            icon="chatbox-ellipses-outline"
            onPress={() => {
              setRespondingTo(item);
              setResponseMessage('');
            }}
          />
        ) : null}
      </Surface>
    );
  };

  if (loading) return <LoadingState palette={palette} title="Mentorship" />;

  const data: (Member | MentorshipRequest)[] = tab === 'mentors' ? filteredMentors : tab === 'requests' ? myRequests : myMentees;

  return (
    <>
      <FlatList
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        data={data}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
        ListHeaderComponent={
          <View>
            <ScreenHeader
              palette={palette}
              eyebrow="Guidance"
              title="Mentorship"
              description="Connect with old students who can guide professional, academic, and life decisions."
              icon="people-outline"
            />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {TABS.map((item) => (
                <Pressable key={item.key} onPress={() => setTab(item.key)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
                  <Pill palette={palette} active={tab === item.key}>{item.label}</Pill>
                </Pressable>
              ))}
            </View>
            {tab === 'mentors' ? (
              <View>
                <Surface palette={palette} style={{ padding: 14, gap: 10, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ color: palette.text, fontSize: 15, fontFamily: Fonts.bodyBold }}>Mentor availability</Text>
                      <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body, lineHeight: 17 }}>
                        {available ? 'You are listed in the mentor directory.' : 'Switch on to appear as a mentor for other alumni.'}
                      </Text>
                    </View>
                    <Switch
                      value={available}
                      onValueChange={onToggleAvailability}
                      disabled={savingAvailability}
                      trackColor={{ false: palette.border, true: Brand.gold }}
                      thumbColor={available ? Brand.navy : palette.surfaceMuted}
                    />
                  </View>
                  {available ? (
                    <View style={{ gap: 10 }}>
                      <Field
                        palette={palette}
                        label="Mentor bio"
                        value={bio}
                        onChangeText={setBio}
                        placeholder="What guidance can you offer?"
                        icon="create-outline"
                        multiline
                      />
                      <PrimaryButton label="Save bio" palette={palette} tone="outline" onPress={onSaveBio} loading={savingBio} icon="checkmark-outline" />
                    </View>
                  ) : null}
                </Surface>
                <Surface palette={palette} style={{ paddingHorizontal: 12, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Ionicons name="search" size={18} color={palette.textMuted} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search by name, work, or expertise"
                    placeholderTextColor={palette.textMuted}
                    style={{ flex: 1, color: palette.text, fontSize: 15, fontFamily: Fonts.body, minHeight: 46 }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </Surface>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          tab === 'mentors' ? (
            <EmptyState palette={palette} icon="people-outline" title="No mentors found" description={query ? 'Try a different search term or clear the field.' : 'Registered alumni can opt in from their profile or membership desk.'} />
          ) : tab === 'requests' ? (
            <EmptyState palette={palette} icon="paper-plane-outline" title="No requests yet" description="Find a mentor and send a short request when you are ready." />
          ) : (
            <EmptyState palette={palette} icon="file-tray-outline" title="No mentee requests" description="Requests from alumni who want your guidance will appear here." />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) =>
          tab === 'mentors'
            ? renderMentor(item as Member)
            : renderRequest(item as MentorshipRequest, tab === 'requests' ? 'outgoing' : 'incoming')
        }
      />

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Surface palette={palette} style={{ padding: 18, borderBottomWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: palette.text, fontSize: 18, fontFamily: Fonts.display }}>Request mentorship</Text>
                <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, marginTop: 3 }} numberOfLines={1}>
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

      <Modal visible={!!respondingTo} transparent animationType="slide" onRequestClose={() => setRespondingTo(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Surface palette={palette} style={{ padding: 18, borderBottomWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: palette.text, fontSize: 18, fontFamily: Fonts.display }}>Respond to request</Text>
                <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, marginTop: 3 }} numberOfLines={1}>
                  {respondingTo?.mentee?.fullName ? `From ${respondingTo.mentee.fullName}` : 'A short note is optional.'}
                </Text>
              </View>
              <Pressable onPress={() => setRespondingTo(null)} hitSlop={10}>
                <Ionicons name="close" size={24} color={palette.textMuted} />
              </Pressable>
            </View>
            <Field
              palette={palette}
              label="Your response (optional)"
              value={responseMessage}
              onChangeText={setResponseMessage}
              placeholder="Add a welcome or decline note..."
              icon="create-outline"
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Accept" palette={palette} onPress={() => confirmRespond('ACCEPTED')} loading={responding} icon="checkmark-outline" />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Decline" palette={palette} tone="danger" onPress={() => confirmRespond('DECLINED')} loading={responding} icon="close-outline" />
              </View>
            </View>
          </Surface>
        </View>
      </Modal>
    </>
  );
}
