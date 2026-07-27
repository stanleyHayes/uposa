import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Fonts, Radii, type Palette } from '@/constants/theme';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function parseValue(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function DateField({
  palette,
  label,
  value,
  onChange,
  placeholder = 'Select date',
}: {
  palette: Palette;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const today = useMemo(() => new Date(), []);
  const [open, setOpen] = useState(false);
  const selected = parseValue(value);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const openPicker = () => {
    const base = selected ?? today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setOpen(true);
  };

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    // Monday-first offset
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const list: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      list.push(new Date(viewYear, viewMonth, day));
    }
    return list;
  }, [viewYear, viewMonth]);

  const pick = (date: Date) => {
    if (date > today) return;
    onChange(toIsoDate(date));
    setOpen(false);
  };

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: palette.text }]}>{label}</Text>
      <Pressable
        onPress={openPicker}
        style={[styles.inputWrap, { borderColor: palette.border, backgroundColor: palette.background }]}
      >
        <Ionicons name="calendar-outline" size={18} color={palette.textMuted} />
        <Text style={[styles.input, { color: value ? palette.text : palette.textMuted }]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={palette.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.centerWrap} pointerEvents="box-none">
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            {/* Header */}
            <View style={[styles.cardHeader, { backgroundColor: Brand.navy }]}>
              <Text style={styles.cardHeaderEyebrow}>{label.toUpperCase()}</Text>
              <Text style={styles.cardHeaderValue}>
                {selected ? toIsoDate(selected) : 'Select a date'}
              </Text>
            </View>

            {/* Year + month navigation */}
            <View style={styles.navRow}>
              <Pressable onPress={() => setViewYear((y) => y - 1)} hitSlop={10} style={styles.navButton}>
                <Ionicons name="chevron-back" size={18} color={palette.text} />
              </Pressable>
              <Text style={[styles.navTitle, { color: palette.text }]}>
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <Pressable onPress={() => setViewYear((y) => y + 1)} hitSlop={10} style={styles.navButton}>
                <Ionicons name="chevron-forward" size={18} color={palette.text} />
              </Pressable>
            </View>
            <View style={styles.navRow}>
              <Pressable onPress={() => shiftMonth(-1)} hitSlop={10} style={styles.navButton}>
                <Ionicons name="play-back-outline" size={16} color={palette.textMuted} />
              </Pressable>
              <Text style={[styles.navHint, { color: palette.textMuted }]}>month</Text>
              <Pressable onPress={() => shiftMonth(1)} hitSlop={10} style={styles.navButton}>
                <Ionicons name="play-forward-outline" size={16} color={palette.textMuted} />
              </Pressable>
            </View>

            {/* Weekday header */}
            <View style={styles.weekRow}>
              {WEEKDAYS.map((day, index) => (
                <Text key={`${day}-${index}`} style={[styles.weekDay, { color: Brand.gold }]}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Day grid */}
            <View style={styles.grid}>
              {cells.map((date, index) => {
                if (!date) return <View key={`blank-${index}`} style={styles.cell} />;
                const isSelected = selected ? sameDay(date, selected) : false;
                const isToday = sameDay(date, today);
                const isFuture = date > today;
                return (
                  <Pressable
                    key={date.getTime()}
                    onPress={() => pick(date)}
                    disabled={isFuture}
                    style={[
                      styles.cell,
                      isSelected && { backgroundColor: Brand.gold },
                      !isSelected && isToday && { borderWidth: 1, borderColor: palette.tint },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        { color: isFuture ? palette.border : palette.text },
                        isSelected && { color: Brand.navy, fontFamily: Fonts.bodyBold },
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: palette.border }]}>
              <Pressable
                onPress={() => {
                  onChange('');
                  setOpen(false);
                }}
                hitSlop={10}
              >
                <Text style={[styles.footerAction, { color: palette.textMuted }]}>Clear</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const base = selected ?? today;
                  setViewYear(base.getFullYear());
                  setViewMonth(base.getMonth());
                }}
                hitSlop={10}
              >
                <Text style={[styles.footerAction, { color: Brand.gold }]}>Today</Text>
              </Pressable>
            </View>
          </View>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,15,48,0.55)' },
  centerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 340, borderWidth: 1, overflow: 'hidden', ...Radii.card },
  cardHeader: { paddingHorizontal: 18, paddingVertical: 14 },
  cardHeaderEyebrow: { color: Brand.gold, fontSize: 10, fontFamily: Fonts.statusBold, letterSpacing: 1.6, marginBottom: 4 },
  cardHeaderValue: { color: Brand.cream, fontSize: 20, fontFamily: Fonts.display },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginTop: 10 },
  navButton: { padding: 6 },
  navTitle: { fontSize: 17, fontFamily: Fonts.display },
  navHint: { fontSize: 11, fontFamily: Fonts.status, letterSpacing: 1.2, textTransform: 'uppercase' },
  weekRow: { flexDirection: 'row', paddingHorizontal: 10, marginTop: 12 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: Fonts.statusBold, letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, marginTop: 4, marginBottom: 8 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 14, fontFamily: Fonts.body },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerAction: { fontSize: 14, fontFamily: Fonts.statusBold },
});
