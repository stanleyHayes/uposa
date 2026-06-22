import type { ReactElement, ReactNode } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Brand, type Palette } from '@/constants/theme';

export function formatMoney(value?: number, currency = 'GHS') {
  return `${currency} ${(value ?? 0).toLocaleString()}`;
}

export function formatShortDate(value?: string | Date) {
  if (!value) return 'Date pending';
  return new Date(value).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(value?: string | Date) {
  if (!value) return 'Date pending';
  return new Date(value).toLocaleString('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function initials(name?: string) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return 'U';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

export function ScreenScroll({
  palette,
  children,
  padded = true,
  keyboardShouldPersistTaps,
  style,
  contentContainerStyle,
  refreshControl,
}: {
  palette: Palette;
  children: ReactNode;
  padded?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: ReactElement<RefreshControlProps>;
}) {
  return (
    <ScrollView
      style={[{ backgroundColor: palette.background }, style]}
      contentContainerStyle={[padded && styles.screenPadding, contentContainerStyle]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
}

export function ScreenHeader({
  palette,
  eyebrow,
  title,
  description,
  icon,
  right,
}: {
  palette: Palette;
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: palette.accent }]}>{eyebrow}</Text> : null}
        <Text style={[styles.pageTitle, { color: palette.text }]}>{title}</Text>
        {description ? <Text style={[styles.pageDescription, { color: palette.textMuted }]}>{description}</Text> : null}
      </View>
      {right ?? (icon ? <IconTile icon={icon} palette={palette} tone="gold" /> : null)}
    </View>
  );
}

export function Surface({
  palette,
  children,
  tone = 'default',
  style,
}: {
  palette: Palette;
  children: ReactNode;
  tone?: 'default' | 'muted' | 'navy' | 'gold';
  style?: StyleProp<ViewStyle>;
}) {
  const backgroundColor =
    tone === 'navy' ? Brand.navy : tone === 'gold' ? Brand.gold : tone === 'muted' ? palette.surfaceMuted : palette.surface;
  const borderColor = tone === 'navy' ? 'rgba(255,248,220,0.18)' : tone === 'gold' ? 'rgba(0,27,80,0.16)' : palette.border;
  return <View style={[styles.surface, { backgroundColor, borderColor }, style]}>{children}</View>;
}

export function HeroPanel({
  palette,
  eyebrow,
  title,
  body,
  icon = 'sparkles-outline',
  children,
}: {
  palette: Palette;
  eyebrow?: string;
  title: string;
  body?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children?: ReactNode;
}) {
  return (
    <Surface palette={palette} tone="navy" style={styles.hero}>
      <View style={styles.heroMark}>
        <Text style={styles.heroWatermark}>UPOSA</Text>
        <IconTile icon={icon} palette={palette} tone="gold" />
      </View>
      {eyebrow ? <Text style={styles.heroEyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.heroTitle}>{title}</Text>
      {body ? <Text style={styles.heroBody}>{body}</Text> : null}
      {children ? <View style={styles.heroChildren}>{children}</View> : null}
    </Surface>
  );
}

export function IconTile({
  icon,
  palette,
  tone = 'muted',
  size = 20,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  palette: Palette;
  tone?: 'muted' | 'navy' | 'gold' | 'plain';
  size?: number;
}) {
  const backgroundColor =
    tone === 'navy' ? Brand.navy : tone === 'gold' ? Brand.gold : tone === 'plain' ? 'transparent' : palette.surfaceMuted;
  const color = tone === 'gold' ? Brand.navy : tone === 'navy' ? Brand.cream : palette.text;
  return (
    <View style={[styles.iconTile, { backgroundColor, borderColor: tone === 'plain' ? 'transparent' : palette.border }]}>
      <Ionicons name={icon} size={size} color={color} />
    </View>
  );
}

export function Pill({
  palette,
  children,
  active,
  tone = 'muted',
  style,
}: {
  palette: Palette;
  children: ReactNode;
  active?: boolean;
  tone?: 'muted' | 'gold' | 'navy';
  style?: StyleProp<ViewStyle>;
}) {
  const backgroundColor = active || tone === 'gold' ? Brand.gold : tone === 'navy' ? Brand.navy : palette.surfaceMuted;
  const color = active || tone === 'gold' ? Brand.navy : tone === 'navy' ? Brand.cream : palette.textMuted;
  return (
    <View style={[styles.pill, { backgroundColor, borderColor: active ? Brand.gold : palette.border }, style]}>
      <Text style={[styles.pillText, { color }]}>{children}</Text>
    </View>
  );
}

export function SectionTitle({
  palette,
  title,
  action,
}: {
  palette: Palette;
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
      {action}
    </View>
  );
}

export function ActionText({
  label,
  palette,
  onPress,
}: {
  label: string;
  palette: Palette;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={[styles.actionText, { color: palette.tint }]}>{label}</Text>
    </Pressable>
  );
}

export function StatTile({
  palette,
  label,
  value,
  icon,
  tone = 'muted',
}: {
  palette: Palette;
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: 'muted' | 'gold' | 'navy';
}) {
  return (
    <Surface palette={palette} style={styles.statTile}>
      <IconTile icon={icon} palette={palette} tone={tone === 'muted' ? 'muted' : tone} size={18} />
      <Text style={[styles.statValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: palette.textMuted }]}>{label}</Text>
    </Surface>
  );
}

export function ActionRow({
  palette,
  icon,
  title,
  description,
  onPress,
  trailing,
}: {
  palette: Palette;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  const content = (
    <>
      <IconTile icon={icon} palette={palette} tone="muted" />
      <View style={styles.actionContent}>
        <Text style={[styles.actionTitle, { color: palette.text }]} numberOfLines={1}>
          {title}
        </Text>
        {description ? (
          <Text style={[styles.actionDescription, { color: palette.textMuted }]} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      {trailing ?? (onPress ? <Ionicons name="arrow-forward" size={18} color={palette.textMuted} /> : null)}
    </>
  );

  if (!onPress) {
    return (
      <Surface palette={palette} style={styles.actionRow}>
        {content}
      </Surface>
    );
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.78 : 1 }]}>
      <Surface palette={palette} style={styles.actionRow}>
        {content}
      </Surface>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  palette,
  onPress,
  disabled,
  loading,
  icon,
  tone = 'navy',
}: {
  label: string;
  palette: Palette;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'navy' | 'gold' | 'danger' | 'outline';
}) {
  const backgroundColor =
    tone === 'gold' ? Brand.gold : tone === 'danger' ? palette.danger : tone === 'outline' ? 'transparent' : Brand.navy;
  const borderColor = tone === 'outline' ? palette.border : backgroundColor;
  const color = tone === 'gold' || tone === 'outline' ? Brand.navy : Brand.cream;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor, opacity: disabled || loading ? 0.48 : pressed ? 0.82 : 1 },
      ]}
    >
      {loading ? <SkeletonBar palette={palette} width={94} height={14} dark={tone === 'navy' || tone === 'danger'} /> : null}
      {!loading && icon ? <Ionicons name={icon} size={17} color={color} /> : null}
      {!loading ? <Text style={[styles.buttonText, { color }]}>{label}</Text> : null}
    </Pressable>
  );
}

export function Field({
  palette,
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
  multiline,
  secureTextEntry,
  right,
  autoCapitalize,
}: {
  palette: Palette;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  secureTextEntry?: boolean;
  right?: ReactNode;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: palette.text }]}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMultiline,
          { borderColor: palette.border, backgroundColor: palette.background },
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={palette.textMuted} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize ?? (keyboardType === 'email-address' ? 'none' : 'sentences')}
          autoCorrect={keyboardType !== 'email-address'}
          style={[styles.input, multiline && styles.inputMultiline, { color: palette.text }]}
        />
        {right}
      </View>
    </View>
  );
}

export function AvatarMark({
  palette,
  name,
  photoUrl,
  size = 48,
}: {
  palette: Palette;
  name?: string;
  photoUrl?: string;
  size?: number;
}) {
  const style = { width: size, height: size };
  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} resizeMode="cover" style={[styles.avatar, style]} />;
  }
  return (
    <View style={[styles.avatar, style, { backgroundColor: Brand.navy, borderColor: palette.border }]}>
      <Text
        style={[
          styles.avatarText,
          {
            color: Brand.gold,
            fontSize: Math.max(13, size * 0.32),
            lineHeight: Math.max(15, size * 0.36),
          },
        ]}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

export function EmptyState({
  palette,
  icon,
  title,
  description,
  action,
}: {
  palette: Palette;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Surface palette={palette} style={styles.empty}>
      <IconTile icon={icon} palette={palette} tone="muted" size={26} />
      <Text style={[styles.emptyTitle, { color: palette.text }]}>{title}</Text>
      {description ? <Text style={[styles.emptyDescription, { color: palette.textMuted }]}>{description}</Text> : null}
      {action}
    </Surface>
  );
}

export function SkeletonBar({
  palette,
  width = '100%',
  height = 12,
  dark,
  style,
}: {
  palette: Palette;
  width?: number | `${number}%`;
  height?: number;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          backgroundColor: dark ? 'rgba(255,248,220,0.22)' : palette.surfaceMuted,
          borderColor: dark ? 'rgba(255,248,220,0.1)' : palette.border,
        },
        style,
      ]}
    />
  );
}

export function LoadingState({
  palette,
  rows = 4,
  title,
}: {
  palette: Palette;
  rows?: number;
  title?: string;
}) {
  return (
    <ScreenScroll palette={palette}>
      <ScreenHeader palette={palette} title={title ?? 'Loading'} description="Preparing your alumni desk." icon="sync-outline" />
      <View style={styles.loadingStack}>
        {Array.from({ length: rows }).map((_, index) => (
          <Surface key={index} palette={palette} style={styles.skeletonCard}>
            <SkeletonBar palette={palette} width="34%" height={12} />
            <SkeletonBar palette={palette} width="82%" height={18} />
            <SkeletonBar palette={palette} width="58%" height={12} />
          </Surface>
        ))}
      </View>
    </ScreenScroll>
  );
}

export function ProgressBar({
  palette,
  percent,
  style,
}: {
  palette: Palette;
  percent: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.progressTrack, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }, style]}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, percent))}%` }]} />
    </View>
  );
}

export function DetailRow({
  palette,
  icon,
  label,
  value,
  onPress,
}: {
  palette: Palette;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <ActionRow
      palette={palette}
      icon={icon}
      title={label}
      description={value}
      onPress={onPress}
      trailing={onPress ? <Ionicons name="open-outline" size={17} color={palette.textMuted} /> : undefined}
    />
  );
}

export const uiStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gap8: { gap: 8 },
  gap10: { gap: 10 },
  gap12: { gap: 12 },
  gap14: { gap: 14 },
});

const styles = StyleSheet.create({
  screenPadding: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 16 },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 6 },
  pageTitle: { fontSize: 28, fontWeight: '900', lineHeight: 32 },
  pageDescription: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  surface: { borderWidth: 1, borderRadius: 0, overflow: 'hidden' },
  hero: { padding: 18, gap: 8, marginBottom: 18, position: 'relative' },
  heroMark: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroWatermark: { color: 'rgba(255,248,220,0.09)', fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  heroEyebrow: { color: Brand.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.8, textTransform: 'uppercase' },
  heroTitle: { color: Brand.cream, fontSize: 24, fontWeight: '900', lineHeight: 29 },
  heroBody: { color: 'rgba(255,248,220,0.72)', fontSize: 14, lineHeight: 20 },
  heroChildren: { marginTop: 10 },
  iconTile: { width: 44, height: 44, borderWidth: 1, borderRadius: 0, alignItems: 'center', justifyContent: 'center' },
  pill: { alignSelf: 'flex-start', minHeight: 24, paddingHorizontal: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  actionText: { fontSize: 12, fontWeight: '800' },
  statTile: { flex: 1, minHeight: 118, padding: 12, gap: 8, justifyContent: 'space-between' },
  statValue: { fontSize: 21, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '700', lineHeight: 15 },
  pressable: { marginBottom: 10 },
  actionRow: { minHeight: 78, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionContent: { flex: 1, minWidth: 0 },
  actionTitle: { fontSize: 15, fontWeight: '900' },
  actionDescription: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  button: { height: 48, borderWidth: 1, borderRadius: 0, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  buttonText: { fontSize: 15, fontWeight: '900' },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '800', marginBottom: 7 },
  inputWrap: { minHeight: 46, borderWidth: 1, borderRadius: 0, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputWrapMultiline: { alignItems: 'flex-start', paddingVertical: 10 },
  input: { flex: 1, minHeight: 42, fontSize: 15 },
  inputMultiline: { minHeight: 104, textAlignVertical: 'top' },
  avatar: { borderRadius: 0, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { fontWeight: '900', includeFontPadding: false, textAlign: 'center', textAlignVertical: 'center' },
  empty: { minHeight: 190, padding: 22, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptyDescription: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  skeleton: { borderRadius: 0, borderWidth: 1 },
  loadingStack: { gap: 10 },
  skeletonCard: { minHeight: 96, padding: 14, gap: 12 },
  progressTrack: { height: 10, borderWidth: 1, borderRadius: 0, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Brand.gold },
});
