import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { Fonts, type Palette } from '@/constants/theme';

/**
 * Palette-aware styles for react-native-markdown-display. RN does not
 * synthesize custom-font weights, so every weight is expressed via
 * `fontFamily` only (see constants/theme.ts).
 */
export function markdownStyles(palette: Palette) {
  return StyleSheet.create({
    body: {
      color: palette.text,
      fontSize: 15,
      lineHeight: 24,
      fontFamily: Fonts.body,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 12,
    },
    heading1: {
      color: palette.text,
      fontFamily: Fonts.displayHeavy,
      fontSize: 26,
      lineHeight: 32,
      marginTop: 8,
      marginBottom: 10,
    },
    heading2: {
      color: palette.text,
      fontFamily: Fonts.display,
      fontSize: 22,
      lineHeight: 28,
      marginTop: 8,
      marginBottom: 8,
    },
    heading3: {
      color: palette.text,
      fontFamily: Fonts.display,
      fontSize: 18,
      lineHeight: 24,
      marginTop: 6,
      marginBottom: 6,
    },
    heading4: {
      color: palette.text,
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 22,
      marginTop: 6,
      marginBottom: 6,
    },
    heading5: {
      color: palette.text,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 15,
      lineHeight: 21,
      marginTop: 4,
      marginBottom: 4,
    },
    heading6: {
      color: palette.textMuted,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 4,
      marginBottom: 4,
    },
    strong: {
      fontFamily: Fonts.bodyBold,
    },
    em: {
      fontFamily: Fonts.bodyItalic,
    },
    s: {
      textDecorationLine: 'line-through',
    },
    link: {
      color: palette.tint,
      fontFamily: Fonts.bodySemiBold,
      textDecorationLine: 'underline',
    },
    blockquote: {
      backgroundColor: palette.surfaceMuted,
      borderLeftWidth: 3,
      borderLeftColor: palette.accent,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
    bullet_list: {
      marginBottom: 12,
    },
    ordered_list: {
      marginBottom: 12,
    },
    list_item: {
      flexDirection: 'row',
      marginBottom: 4,
      paddingLeft: 4,
    },
    bullet_list_icon: {
      color: palette.accent,
      fontFamily: Fonts.bodyBold,
      marginRight: 8,
    },
    ordered_list_icon: {
      color: palette.textMuted,
      fontFamily: Fonts.bodySemiBold,
      marginRight: 8,
    },
    code_inline: {
      backgroundColor: palette.surfaceMuted,
      color: palette.text,
      fontFamily: Fonts.body,
      fontSize: 13,
      paddingHorizontal: 4,
      borderRadius: 0,
    },
    code_block: {
      backgroundColor: palette.surfaceMuted,
      color: palette.text,
      fontFamily: Fonts.body,
      fontSize: 13,
      lineHeight: 19,
      padding: 12,
      borderRadius: 0,
      marginBottom: 12,
    },
    fence: {
      backgroundColor: palette.surfaceMuted,
      color: palette.text,
      fontFamily: Fonts.body,
      fontSize: 13,
      lineHeight: 19,
      padding: 12,
      borderRadius: 0,
      marginBottom: 12,
      borderWidth: 0,
    },
    hr: {
      backgroundColor: palette.border,
      height: 1,
      marginVertical: 12,
    },
    table: {
      borderColor: palette.border,
      marginBottom: 12,
    },
    th: {
      fontFamily: Fonts.bodySemiBold,
      padding: 6,
    },
    td: {
      fontFamily: Fonts.body,
      padding: 6,
    },
    image: {
      borderRadius: 0,
      marginVertical: 8,
    },
  });
}

type MarkdownBodyProps = {
  palette: Palette;
  children: string;
};

/** Renders markdown content themed to the current color scheme. */
export function MarkdownBody({ palette, children }: MarkdownBodyProps) {
  return <Markdown style={markdownStyles(palette)}>{children}</Markdown>;
}
