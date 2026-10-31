import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';

type DeleteAccountSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Resolves to a message if it couldn't be done (say, a copy is still in your hands). */
  onDelete: () => Promise<string | null>;
};

export function DeleteAccountSheet({ visible, onClose, onDelete }: DeleteAccountSheetProps) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // Fresh each time it opens (React's "adjust state when a prop changes").
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setBusy(false);
      setProblem(null);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Delete your account?</Text>
          <Text style={styles.body}>
            Your sign-in, name, friendships and place in every line are erased. This can't be
            undone.
          </Text>
          <Text style={styles.body}>
            The journeys you were part of stay whole for everyone else: each of your stops
            remains on the map as "a reader" in your city, with no name.
          </Text>
          <Text style={styles.body}>
            If a copy is in your hands, or one you lent is still travelling, pass it on or
            rest it first.
          </Text>
          {problem && <Text style={styles.problem}>{problem}</Text>}

          <Pressable
            style={[styles.delete, busy && styles.disabled]}
            disabled={busy}
            accessibilityRole="button"
            onPress={async () => {
              setBusy(true);
              const message = await onDelete();
              if (message) {
                setProblem(message);
                setBusy(false);
              }
            }}
          >
            <Text style={styles.deleteText}>{busy ? 'Deleting…' : 'Yes, delete my account'}</Text>
          </Pressable>
          <Pressable style={styles.cancel} onPress={onClose} accessibilityRole="button">
            <Text style={styles.cancelText}>Keep my account</Text>
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
    borderRadius: theme.radius.md,
    padding: 22,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 21,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.muted,
    marginBottom: 10,
  },
  problem: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: theme.colors.text,
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radius.md,
    padding: 10,
    marginBottom: 10,
  },
  delete: {
    backgroundColor: theme.colors.stamp,
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  disabled: {
    opacity: 0.45,
  },
  deleteText: {
    ...theme.caps,
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 13,
  },
  cancel: {
    alignItems: 'center',
    paddingTop: 12,
  },
  cancelText: {
    color: theme.colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});
