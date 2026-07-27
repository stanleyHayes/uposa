import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { forumApi } from '@/lib/api';
import type { ForumCategory, ForumPost } from '@/lib/types';
import {
  EmptyState,
  Field,
  LoadingState,
  Pill,
  PrimaryButton,
  ScreenHeader,
  Surface,
  formatShortDate,
} from '@/components/mobile-ui';
import { FadeInUp } from '@/components/motion';

const CATEGORIES: { value: ForumCategory; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'ANNOUNCEMENTS', label: 'Announcements' },
  { value: 'CAREERS', label: 'Careers' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'WELFARE', label: 'Welfare' },
];

export default function ForumIndexScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ForumCategory>('GENERAL');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await forumApi.posts({ limit: 50 });
      setPosts(res.data.data ?? []);
    } catch {
      setPosts([]);
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

  const closeModal = () => {
    setModalOpen(false);
    setTitle('');
    setContent('');
    setCategory('GENERAL');
  };

  const onSubmit = async () => {
    if (title.trim().length < 3) {
      Alert.alert('Title required', 'Give your discussion a title of at least 3 characters.');
      return;
    }
    if (content.trim().length < 10) {
      Alert.alert('Content too short', 'Write at least 10 characters so members have context.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await forumApi.create({ title: title.trim(), content: content.trim(), category });
      const created = res.data.data;
      if (created) {
        setPosts((prev) => [created, ...prev]);
      } else {
        await load();
      }
      closeModal();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not create the post.';
      Alert.alert('Post failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState palette={palette} title="Forum" />;

  return (
    <>
      <FlatList
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        data={posts}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
        ListHeaderComponent={
          <View>
            <ScreenHeader
              palette={palette}
              eyebrow="Community"
              title="Forum"
              description="Questions, ideas, announcements, welfare threads, and year-group discussions."
              icon="chatbubbles-outline"
            />
            <PrimaryButton
              label="New post"
              palette={palette}
              tone="gold"
              icon="add-outline"
              onPress={() => setModalOpen(true)}
            />
            <View style={{ height: 12 }} />
          </View>
        }
        ListEmptyComponent={
          <EmptyState palette={palette} icon="chatbubbles-outline" title="No discussions yet" description="Start the first discussion and bring the alumni desk to life." />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item, index }) => {
          const row = (
            <Pressable onPress={() => router.push(`/forum/${item.slug}`)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
              <Surface palette={palette} style={{ padding: 14, gap: 8 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Pill palette={palette} tone={item.isPinned ? 'gold' : 'muted'}>{item.isPinned ? 'Pinned' : item.category}</Pill>
                  {item.isLocked ? <Pill palette={palette}>Locked</Pill> : null}
                </View>
                <Text style={{ color: palette.text, fontSize: 17, fontFamily: Fonts.bodyBold, lineHeight: 23 }} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19 }} numberOfLines={2}>
                  {item.content}
                </Text>
                <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.bodyMedium }}>
                  {item.author?.fullName ?? 'Unknown'} · {formatShortDate(item.createdAt)} · {item._count?.comments ?? item.comments?.length ?? 0} replies
                </Text>
              </Surface>
            </Pressable>
          );
          return index < 8 ? (
            <FadeInUp delay={Math.min(index, 7) * 40} distance={10}>{row}</FadeInUp>
          ) : (
            row
          );
        }}
      />

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Surface palette={palette} style={{ padding: 18, borderBottomWidth: 0, maxHeight: '92%' }}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.text, fontSize: 18, fontFamily: Fonts.display }}>New discussion</Text>
                  <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, marginTop: 3 }}>
                    Choose a category and write enough context for members to join in.
                  </Text>
                </View>
                <Pressable onPress={closeModal} hitSlop={10}>
                  <Ionicons name="close" size={24} color={palette.textMuted} />
                </Pressable>
              </View>
              <Field
                palette={palette}
                label="Title"
                value={title}
                onChangeText={setTitle}
                placeholder="What is this thread about?"
                icon="create-outline"
              />
              <Text style={{ color: palette.text, fontSize: 13, fontFamily: Fonts.bodySemiBold, marginTop: 12, marginBottom: 8 }}>Category</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {CATEGORIES.map((item) => (
                  <Pressable key={item.value} onPress={() => setCategory(item.value)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
                    <Pill palette={palette} active={category === item.value}>{item.label}</Pill>
                  </Pressable>
                ))}
              </View>
              <Field
                palette={palette}
                label="Content"
                value={content}
                onChangeText={setContent}
                placeholder="Share the details..."
                icon="document-text-outline"
                multiline
              />
              <PrimaryButton label="Create post" palette={palette} onPress={onSubmit} loading={submitting} icon="send-outline" />
            </ScrollView>
          </Surface>
        </View>
      </Modal>
    </>
  );
}
