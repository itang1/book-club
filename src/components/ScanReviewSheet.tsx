import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ScannedBook } from '../types';
import { theme } from '../theme';

type Row = ScannedBook & { keep: boolean; already: boolean };

type ScanReviewSheetProps = {
  visible: boolean;
  /** What the scanner found (or one blank row, for adding by hand). */
  found: ScannedBook[];
  /** True when this book is already on the shelf, so it starts unticked. */
  isShelved: (book: ScannedBook) => boolean;
  onClose: () => void;
  onAdd: (books: ScannedBook[]) => Promise<string | null>;
};

/**
 * The scanner only guesses, so nothing is saved until the person has looked at
 * every row: tick the right ones, fix a title, drop a mistake.
 */
export function ScanReviewSheet({ visible, found, isShelved, onClose, onAdd }: ScanReviewSheetProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setRows(
        found.map((book) => {
          const already = isShelved(book);
          return { ...book, keep: !already, already };
        }),
      );
      setBusy(false);
      setProblem(null);
    }
    // Only when the sheet opens: later shelf reloads shouldn't reset edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, found]);

  const change = (index: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const chosen = rows.filter((row) => row.keep && row.title.trim());

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {found.length > 1 ? `We found ${found.length} books` : 'Add a book'}
          </Text>
          <Text style={styles.note}>
            Tick the ones to keep and fix anything we got wrong. Nothing is saved until you add them.
          </Text>
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {rows.map((row, index) => (
              <View key={index} style={styles.row}>
                <Pressable
                  onPress={() => change(index, { keep: !row.keep })}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: row.keep }}
                  accessibilityLabel={`Keep ${row.title || 'this book'}`}
                  hitSlop={8}
                >
                  <Ionicons
                    name={row.keep ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={row.keep ? theme.colors.accent : theme.colors.faint}
                  />
                </Pressable>
                <View style={styles.fields}>
                  <TextInput
                    value={row.title}
                    onChangeText={(title) => change(index, { title })}
                    placeholder="Title"
                    placeholderTextColor={theme.colors.faint}
                    style={styles.input}
                  />
                  <TextInput
                    value={row.author}
                    onChangeText={(author) => change(index, { author })}
                    placeholder="Author"
                    placeholderTextColor={theme.colors.faint}
                    style={[styles.input, styles.authorInput]}
                  />
                  {row.already && <Text style={styles.already}>Already on your shelf</Text>}
                </View>
              </View>
            ))}
          </ScrollView>
          {problem && <Text style={styles.problem}>{problem}</Text>}
          <Pressable
            style={[styles.add, (busy || chosen.length === 0) && styles.disabled]}
            disabled={busy || chosen.length === 0}
            accessibilityRole="button"
            onPress={async () => {
              setBusy(true);
              const message = await onAdd(chosen.map(({ title, author }) => ({ title, author })));
              setBusy(false);
              if (message) setProblem(message);
              else onClose();
            }}
          >
            <Text style={styles.addText}>
              {busy ? 'Adding…' : `Add ${chosen.length} ${chosen.length === 1 ? 'book' : 'books'}`}
            </Text>
          </Pressable>
          <Pressable style={styles.cancel} onPress={onClose} accessibilityRole="button">
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 26, 23, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 22,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 21,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  note: { fontSize: 13, lineHeight: 19, color: theme.colors.muted, marginBottom: 12 },
  list: { flexGrow: 0, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  fields: { flex: 1 },
  input: {
    backgroundColor: theme.colors.soft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  authorInput: { marginTop: 4, fontWeight: '400', fontSize: 13 },
  already: { fontSize: 11, color: theme.colors.muted, marginTop: 3 },
  problem: { fontSize: 13, color: theme.colors.text, fontWeight: '600', marginBottom: 8 },
  add: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  disabled: { opacity: 0.45 },
  addText: { color: theme.colors.onAccent, fontWeight: '700', fontSize: 15 },
  cancel: { alignItems: 'center', paddingTop: 12 },
  cancelText: { color: theme.colors.muted, fontSize: 14, fontWeight: '600' },
});
