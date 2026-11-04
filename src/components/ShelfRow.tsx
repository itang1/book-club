import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ShelfBook } from '../types';
import { theme } from '../theme';

export type ShelfAction = { label: string; onPress: () => void; quiet?: boolean };

/** One book on a shelf: a coloured spine, title and author, a status line, and actions. */
export function ShelfRow({
  book,
  status,
  actions,
}: {
  book: ShelfBook;
  status?: string;
  actions?: ShelfAction[];
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.spine, { backgroundColor: book.coverColor }]} />
      <View style={styles.text}>
        <Text style={styles.title}>{book.title}</Text>
        {book.author ? <Text style={styles.author}>{book.author}</Text> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}
        {actions && actions.length > 0 && (
          <View style={styles.actions}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                accessibilityRole="button"
                style={[styles.action, action.quiet && styles.actionQuiet]}
              >
                <Text style={[styles.actionText, action.quiet && styles.actionTextQuiet]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  spine: { width: 8, borderRadius: theme.radius.sm },
  text: { flex: 1 },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  author: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
  status: { fontSize: 12, color: theme.colors.muted, marginTop: 6, fontStyle: 'italic' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  action: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionQuiet: { backgroundColor: theme.colors.soft },
  actionText: { color: theme.colors.onAccent, fontWeight: '700', fontSize: 13 },
  actionTextQuiet: { color: theme.colors.muted },
});
