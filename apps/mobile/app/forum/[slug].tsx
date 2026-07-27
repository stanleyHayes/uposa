import { useCallback, useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { forumApi } from '@/lib/api';
import type { ForumComment, ForumPost } from '@/lib/types';
import {
  AvatarMark,
  EmptyState,
  Field,
  HeroPanel,
  LoadingState,
  Pill,
  PrimaryButton,
  ScreenScroll,
  SectionTitle,
  Surface,
  formatShortDate,
} from '@/components/mobile-ui';

export default function ForumDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [post, setPost] = useState<ForumPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await forumApi.getBySlug(slug);
      setPost(res.data.data ?? null);
    } catch {
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async () => {
    if (!post) return;
    const content = comment.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      const res = await forumApi.addComment(post.id, { content });
      const newComment = res.data.data;
      if (newComment) {
        setPost((prev) => (prev ? { ...prev, comments: [...(prev.comments ?? []), newComment] } : prev));
      }
      setComment('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not post comment.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState palette={palette} title="Discussion" />;

  if (!post) {
    return (
      <ScreenScroll palette={palette}>
        <EmptyState palette={palette} icon="chatbubble-outline" title="Discussion not found" description="This thread may have been removed or unpublished." />
      </ScreenScroll>
    );
  }

  const comments: ForumComment[] = post.comments ?? [];

  return (
    <ScreenScroll palette={palette} keyboardShouldPersistTaps="handled">
      <HeroPanel
        palette={palette}
        eyebrow={post.category}
        title={post.title}
        body={`${post.author?.fullName ?? 'Unknown'} · ${formatShortDate(post.createdAt)}`}
        icon="chatbubbles-outline"
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {post.isPinned ? <Pill palette={palette} tone="gold">Pinned</Pill> : null}
          {post.isLocked ? <Pill palette={palette}>Locked</Pill> : null}
          <Pill palette={palette}>{comments.length} replies</Pill>
        </View>
      </HeroPanel>

      <Surface palette={palette} style={{ padding: 16 }}>
        <Text style={{ color: palette.text, fontSize: 15, fontFamily: Fonts.body, lineHeight: 24 }}>{post.content}</Text>
      </Surface>

      <SectionTitle palette={palette} title={`Replies (${comments.length})`} />
      {comments.length === 0 ? (
        <EmptyState
          palette={palette}
          icon="chatbubble-outline"
          title="No replies yet"
          description="Be the first to add a thoughtful note to this discussion."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {comments.map((item) => (
            <Surface key={item.id} palette={palette} style={{ padding: 12, flexDirection: 'row', gap: 12 }}>
              <AvatarMark palette={palette} name={item.author?.fullName ?? 'Anonymous'} photoUrl={item.author?.photoUrl} size={42} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: palette.text, fontSize: 14, fontFamily: Fonts.bodyBold }}>{item.author?.fullName ?? 'Anonymous'}</Text>
                <Text style={{ color: palette.text, fontSize: 14, fontFamily: Fonts.body, lineHeight: 20 }}>{item.content}</Text>
                <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.body }}>{formatShortDate(item.createdAt)}</Text>
              </View>
            </Surface>
          ))}
        </View>
      )}

      {!post.isLocked ? (
        <Surface palette={palette} style={{ padding: 16, marginTop: 18 }}>
          <Text style={{ color: palette.text, fontSize: 17, fontFamily: Fonts.display, marginBottom: 8 }}>Add reply</Text>
          <Field
            palette={palette}
            label="Your comment"
            value={comment}
            onChangeText={setComment}
            placeholder="Share your thoughts..."
            icon="create-outline"
            multiline
          />
          <PrimaryButton
            label="Post reply"
            palette={palette}
            onPress={onSubmit}
            disabled={!comment.trim()}
            loading={submitting}
            icon="send-outline"
          />
        </Surface>
      ) : (
        <Surface palette={palette} tone="muted" style={{ padding: 14, marginTop: 18 }}>
          <Text style={{ color: palette.textMuted, fontSize: 14 }}>This discussion is locked.</Text>
        </Surface>
      )}
    </ScreenScroll>
  );
}
