import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, Fonts, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function SelectField({
  palette,
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  disabled,
}: {
  palette: Palette;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const scheme = useColorScheme() ?? 'light';
  const modalPalette = Colors[scheme];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    // Legacy free-text values (stored before the dropdown existed) stay selectable.
    const base = value && !options.includes(value) ? [value, ...options] : options;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((option) => option.toLowerCase().includes(q));
  }, [options, value, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: palette.text }]}>{label}</Text>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={[
          styles.inputWrap,
          {
            borderColor: palette.border,
            backgroundColor: palette.background,
            opacity: disabled ? 0.45 : 1,
          },
        ]}
      >
        <Ionicons name="list-outline" size={18} color={palette.textMuted} />
        <Text style={[styles.input, { color: value ? palette.text : palette.textMuted }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={palette.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={[styles.sheet, { backgroundColor: modalPalette.surface, borderColor: modalPalette.border }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: modalPalette.text }]}>{label}</Text>
            <Pressable onPress={close} hitSlop={10}>
              <Ionicons name="close" size={20} color={modalPalette.textMuted} />
            </Pressable>
          </View>
          <View style={[styles.searchWrap, { borderColor: modalPalette.border, backgroundColor: modalPalette.background }]}>
            <Ionicons name="search" size={16} color={modalPalette.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search..."
              placeholderTextColor={modalPalette.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.searchInput, { color: modalPalette.text }]}
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={24}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: modalPalette.textMuted }]}>No matches found.</Text>
            }
            renderItem={({ item }) => {
              const active = item === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    close();
                  }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    { borderBottomColor: modalPalette.border },
                    active && { backgroundColor: modalPalette.surfaceMuted },
                    pressed && { opacity: 0.72 },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: modalPalette.text, fontFamily: active ? Fonts.bodyBold : Fonts.body },
                    ]}
                  >
                    {item}
                  </Text>
                  {active ? <Ionicons name="checkmark" size={17} color={Brand.gold} /> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontFamily: Fonts.bodySemiBold, marginBottom: 7 },
  inputWrap: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: { flex: 1, minHeight: 42, fontSize: 15, fontFamily: Fonts.body, textAlignVertical: 'center', paddingVertical: 12 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,15,48,0.44)' },
  sheet: { borderTopWidth: 1, maxHeight: '72%', paddingBottom: 12 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sheetTitle: { fontSize: 15, fontFamily: Fonts.display },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    minHeight: 40,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, minHeight: 38, fontSize: 14, fontFamily: Fonts.body },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: 14 },
  emptyText: { fontSize: 13, fontFamily: Fonts.body, textAlign: 'center', paddingVertical: 22 },
});
