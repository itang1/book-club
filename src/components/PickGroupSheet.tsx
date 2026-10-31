import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Group } from '../types';
import { theme } from '../theme';

/** Choose which of your groups a book goes out to. */
export function PickGroupSheet({
  title,
  groups,
  problem,
  onPick,
  onClose,
}: {
  /** The book being lent; the sheet is hidden while this is null. */
  title: string | null;
  groups: Group[];
  problem: string | null;
  onPick: (group: Group) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={title !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Lend “{title}” to a group</Text>
          <Text style={styles.note}>
            It becomes a Traveling Book there: members join the line, it travels from person to
            person, and it comes back to you. You still own it.
          </Text>
          {groups.length === 0 && (
            <Text style={styles.note}>Start or join a group first, in Friends &amp; Groups.</Text>
          )}
          {groups.map((group) => (
            <Pressable
              key={group.id}
              style={styles.option}
              onPress={() => onPick(group)}
              accessibilityRole="button"
            >
              <Text style={styles.optionText}>{group.name}</Text>
            </Pressable>
          ))}
          {problem && <Text style={styles.problem}>{problem}</Text>}
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
    maxWidth: 380,
    backgroundColor: theme.colors.card,
    // The house edge: every pop-up carries the letterhead green.
    borderTopWidth: 4,
    borderTopColor: theme.colors.letterhead,
    borderRadius: theme.radius.md,
    padding: 22,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  note: { fontSize: 13, lineHeight: 19, color: theme.colors.muted, marginBottom: 12 },
  option: {
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  optionText: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  problem: { fontSize: 13, fontWeight: '600', color: theme.colors.text, marginVertical: 6 },
  cancel: { alignItems: 'center', paddingTop: 8 },
  cancelText: { color: theme.colors.muted, fontSize: 14, fontWeight: '600' },
});
