import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Brand, Colors, Fonts } from '@/constants/theme';
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
import { ModerationButton, useModeration, type ModerationTarget } from '@/components/moderation';

export default function ForumDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [post, setPost] = useState<ForumPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');

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

  // Blocking takes their content off this screen at once; the refetch then
  // reflects the server-side filtering.
  const onBlocked = (memberId: string) => {
    if (post?.authorId === memberId) {
      if (router.canGoBack()) router.back();
      else router.replace('/forum');
      return;
    }
    setPost((prev) => (prev ? { ...prev, comments: prev.comments?.filter((item) => item.authorId !== memberId) } : prev));
    load();
  };
  const moderation = useModeration(onBlocked);

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
      setCommentError('');
    } catch (err: any) {
      // e.g. 422 "Please remove offensive language before posting." — shown under the field.
      setCommentError(err?.response?.data?.message || 'Could not post comment.');
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
  const postTarget: ModerationTarget = {
    targetType: 'FORUM_POST',
    targetId: post.id,
    author: post.authorId ? { id: post.authorId, fullName: post.author?.fullName } : null,
  };
  const commentTarget = (item: ForumComment): ModerationTarget => ({
    targetType: 'FORUM_COMMENT',
    targetId: item.id,
    author: item.authorId ? { id: item.authorId, fullName: item.author?.fullName } : null,
  });

  return (
    <ScreenScroll palette={palette} keyboardShouldPersistTaps="handled">
      <HeroPanel
        palette={palette}
        eyebrow={post.category}
        title={post.title}
        body={`${post.author?.fullName ?? 'Unknown'} · ${formatShortDate(post.createdAt)}`}
        icon="chatbubbles-outline"
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {post.isPinned ? <Pill palette={palette} tone="gold">Pinned</Pill> : null}
          {post.isLocked ? <Pill palette={palette}>Locked</Pill> : null}
          <Pill palette={palette}>{comments.length} replies</Pill>
          <View style={{ marginLeft: 'auto' }}>
            <ModerationButton target={postTarget} onOpen={moderation.open} isOwn={moderation.isOwn} color={Brand.cream} />
          </View>
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
            <Pressable key={item.id} onLongPress={() => moderation.open(commentTarget(item))} delayLongPress={350}>
            <Surface palette={palette} style={{ padding: 12, flexDirection: 'row', gap: 12 }}>
              <AvatarMark palette={palette} name={item.author?.fullName ?? 'Anonymous'} photoUrl={item.author?.photoUrl} size={42} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ flex: 1, color: palette.text, fontSize: 14, fontFamily: Fonts.bodyBold }}>{item.author?.fullName ?? 'Anonymous'}</Text>
                  <ModerationButton target={commentTarget(item)} onOpen={moderation.open} isOwn={moderation.isOwn} color={palette.textMuted} />
                </View>
                <Text style={{ color: palette.text, fontSize: 14, fontFamily: Fonts.body, lineHeight: 20 }}>{item.content}</Text>
                <Text style={{ color: palette.textMuted, fontSize: 11, fontFamily: Fonts.body }}>{formatShortDate(item.createdAt)}</Text>
              </View>
            </Surface>
            </Pressable>
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
            onChangeText={(value) => {
              setComment(value);
              setCommentError('');
            }}
            placeholder="Share your thoughts..."
            icon="create-outline"
            multiline
          />
          {commentError ? (
            <Text accessibilityRole="alert" style={{ color: palette.danger, fontSize: 13, fontFamily: Fonts.body, marginBottom: 10 }}>{commentError}</Text>
          ) : null}
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
      {moderation.sheet}
    </ScreenScroll>
  );
}
