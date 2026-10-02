import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, type AlertButton } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { blocksApi, reportsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { ReportReason, ReportTargetType } from '@/lib/types';
import { PrimaryButton } from '@/components/mobile-ui';

// Plain-language report reasons, in the order shown to members.
const REPORT_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: 'SPAM', label: 'Spam or scam', hint: 'Advertising, fraud or repeated unwanted posts' },
  { value: 'HARASSMENT', label: 'Harassment or bullying', hint: 'Targeting, insulting or intimidating someone' },
  { value: 'HATE', label: 'Hate or discrimination', hint: 'Attacks on tribe, ethnicity, religion, gender or other identity' },
  { value: 'SEXUAL', label: 'Sexual or explicit content', hint: 'Nudity, sexual content or solicitation' },
  { value: 'VIOLENCE', label: 'Violence or threats', hint: 'Threats, encouraging harm or graphic violence' },
  { value: 'MISLEADING', label: 'False or misleading', hint: 'Fake jobs, impersonation or misinformation' },
  { value: 'OTHER', label: 'Something else', hint: 'Tell us what is wrong in the details box' },
];

const TARGET_NOUN: Record<ReportTargetType, string> = {
  FORUM_POST: 'post',
  FORUM_COMMENT: 'comment',
  JOB: 'job post',
  MEMBER: 'member',
};

export const REPORT_CONFIRMATION = 'Thanks. Our moderators will review this within 24 hours.';
export const BLOCK_EXPLANATION = "You won't see their posts, comments or jobs, and they won't appear in your directory.";

export type ModerationTarget = {
  targetType: ReportTargetType;
  targetId: string;
  /** The member behind the content; null for admin-posted content. */
  author?: { id: string; fullName?: string } | null;
  /** Jobs can be reported but not used to block (block from the poster's profile). */
  canBlock?: boolean;
};

function messageOf(err: unknown): string | undefined {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
}

function ReportSheet({ target, onClose }: { target: ModerationTarget | null; onClose: () => void }) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setReason(null);
    setDetails('');
    setError('');
    onClose();
  };

  const submit = async () => {
    if (!target) return;
    if (!reason) {
      setError('Choose a reason for the report.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // 201 for a new report, 200 if already reported by this member — both are a success.
      await reportsApi.create({ targetType: target.targetType, targetId: target.targetId, reason, details: details.trim() || undefined });
      close();
      Alert.alert('Report sent', REPORT_CONFIRMATION);
    } catch (err) {
      setError(messageOf(err) || 'Could not send your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={target !== null} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,15,48,0.44)' }} onPress={close} accessibilityLabel="Close report" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: palette.surface, borderTopWidth: 1, borderColor: palette.border, maxHeight: '88%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
            <Text style={{ color: palette.text, fontSize: 17, fontFamily: Fonts.display }}>
              Report this {target ? TARGET_NOUN[target.targetType] : 'content'}
            </Text>
            <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={palette.textMuted} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 6, gap: 8 }} keyboardShouldPersistTaps="handled">
            <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body }}>What is wrong with it?</Text>
            {REPORT_REASONS.map((item) => {
              const active = reason === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => {
                    setReason(item.value);
                    setError('');
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    gap: 10,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: active ? palette.tint : palette.border,
                    backgroundColor: active ? palette.surfaceMuted : palette.background,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? palette.tint : palette.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.text, fontSize: 14, fontFamily: Fonts.bodySemiBold }}>{item.label}</Text>
                    <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body, marginTop: 2 }}>{item.hint}</Text>
                  </View>
                </Pressable>
              );
            })}
            <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, marginTop: 6 }}>Details (optional)</Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Anything that helps the moderators understand the problem"
              placeholderTextColor={palette.textMuted}
              multiline
              maxLength={1000}
              style={{
                minHeight: 80,
                borderWidth: 1,
                borderColor: palette.border,
                backgroundColor: palette.background,
                color: palette.text,
                padding: 10,
                fontSize: 14,
                fontFamily: Fonts.body,
                textAlignVertical: 'top',
              }}
            />
            {error ? <Text style={{ color: palette.danger, fontSize: 13, fontFamily: Fonts.body }}>{error}</Text> : null}
            <PrimaryButton label="Send report" palette={palette} onPress={submit} loading={submitting} icon="flag-outline" tone="danger" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Report / Block actions for member-generated content (Apple 1.2, Google Play
 * UGC policy). `open(target)` shows the action menu; render `sheet` once on
 * the screen. Nothing is offered on the viewer's own content.
 */
export function useModeration(onBlocked?: (memberId: string) => void) {
  const userId = useAuthStore((s) => s.user?.id);
  const [reportTarget, setReportTarget] = useState<ModerationTarget | null>(null);

  const isOwn = (target: ModerationTarget) => Boolean(target.author?.id && target.author.id === userId);

  const confirmBlock = (memberId: string, name: string) => {
    Alert.alert(`Block ${name}?`, BLOCK_EXPLANATION, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await blocksApi.block(memberId);
            onBlocked?.(memberId);
            Alert.alert('Blocked', `${name} is blocked. You can unblock them in Settings → Privacy & data.`);
          } catch (err) {
            Alert.alert('Not blocked', messageOf(err) || 'Could not block this member. Please try again.');
          }
        },
      },
    ]);
  };

  const open = (target: ModerationTarget) => {
    if (isOwn(target)) return;
    const name = target.author?.fullName || 'this member';
    const authorId = target.author?.id;
    const buttons: AlertButton[] = [{ text: 'Report', onPress: () => setReportTarget(target) }];
    if (target.canBlock !== false && authorId) {
      buttons.push({ text: `Block ${name}`, style: 'destructive', onPress: () => confirmBlock(authorId, name) });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(`${TARGET_NOUN[target.targetType].replace(/^./, (c) => c.toUpperCase())} options`, undefined, buttons);
  };

  return { open, isOwn, sheet: <ReportSheet target={reportTarget} onClose={() => setReportTarget(null)} /> };
}

/** ⋯ button that opens the Report / Block menu; renders nothing on your own content. */
export function ModerationButton({
  target,
  onOpen,
  isOwn,
  color,
}: {
  target: ModerationTarget;
  onOpen: (target: ModerationTarget) => void;
  isOwn: (target: ModerationTarget) => boolean;
  color: string;
}) {
  if (isOwn(target)) return null;
  return (
    <Pressable onPress={() => onOpen(target)} hitSlop={10} accessibilityRole="button" accessibilityLabel="More actions: report or block">
      <Ionicons name="ellipsis-horizontal" size={20} color={color} />
    </Pressable>
  );
}
