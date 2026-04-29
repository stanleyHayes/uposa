import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { forumApi } from '@/lib/api';
import type { ForumPost, ForumComment } from '@/lib/types';

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
        setPost((prev) =>
          prev ? { ...prev, comments: [...(prev.comments ?? []), newComment] } : prev
        );
      }
      setComment('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not post comment.';
      Alert.alert('Error', msg);
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

  if (!post) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.textMuted }}>Discussion not found.</Text>
      </View>
    );
  }

  const comments: ForumComment[] = post.comments ?? [];

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.body}>
        <View style={[styles.chip, { backgroundColor: Brand.cream, borderColor: palette.border }]}>
          <Text style={[styles.chipText, { color: Brand.navy }]}>{post.category}</Text>
        </View>
        <Text style={[styles.title, { color: palette.text }]}>{post.title}</Text>
        <Text style={[styles.author, { color: palette.textMuted }]}>
          {post.author?.fullName ?? 'Unknown'} · {new Date(post.createdAt).toLocaleDateString()}
        </Text>
        <Text style={[styles.content, { color: palette.text }]}>{post.content}</Text>

        <Text style={[styles.commentsHeading, { color: palette.text }]}>
          Comments ({comments.length})
        </Text>

        {comments.length === 0 ? (
          <Text style={[styles.empty, { color: palette.textMuted }]}>
            No comments yet. Be the first to share your thoughts.
          </Text>
        ) : (
          comments.map((c) => (
            <View
              key={c.id}
              style={[styles.commentCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
            >
              <Text style={[styles.commentAuthor, { color: palette.text }]}>
                {c.author?.fullName ?? 'Anonymous'}
              </Text>
              <Text style={[styles.commentText, { color: palette.text }]}>{c.content}</Text>
              <Text style={[styles.commentTime, { color: palette.textMuted }]}>
                {new Date(c.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}

        {!post.isLocked ? (
          <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.formTitle, { color: palette.text }]}>Add a comment</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Share your thoughts…"
              placeholderTextColor={palette.textMuted}
              style={[
                styles.input,
                { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
              ]}
              multiline
            />
            <Pressable
              onPress={onSubmit}
              disabled={submitting || !comment.trim()}
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor: Brand.navy,
                  opacity: pressed || submitting || !comment.trim() ? 0.6 : 1,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={Brand.cream} />
              ) : (
                <View style={styles.btnInner}>
                  <Ionicons name="send" size={15} color={Brand.cream} />
                  <Text style={styles.btnText}>Post comment</Text>
                </View>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={[styles.lockedCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
            <Ionicons name="lock-closed-outline" size={16} color={palette.textMuted} />
            <Text style={{ color: palette.textMuted }}>This discussion is locked.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 40 },
  body: { padding: 16, gap: 8 },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  title: { fontSize: 22, fontWeight: '800', lineHeight: 28, marginTop: 4 },
  author: { fontSize: 12 },
  content: { fontSize: 15, lineHeight: 23, marginTop: 6 },
  commentsHeading: { fontSize: 16, fontWeight: '700', marginTop: 18 },
  empty: { fontSize: 13, fontStyle: 'italic', paddingVertical: 8 },
  commentCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  commentAuthor: { fontSize: 13, fontWeight: '700' },
  commentText: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  commentTime: { fontSize: 11, marginTop: 6 },
  formCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  formTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  btn: {
    marginTop: 10,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btnText: { color: Brand.cream, fontWeight: '700', fontSize: 14 },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 18,
  },
});
