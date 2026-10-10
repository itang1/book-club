import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Friend } from '../types';
import { theme } from '../theme';

type DevBarProps = {
  members: Friend[];
  currentUserId: string | null;
  onChoose: (personId: string) => void;
  onSignOut: () => void;
};

/** Development only (see lib/devMode). */
export function DevBar({ members, currentUserId, onChoose, onSignOut }: DevBarProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const me = members.find((person) => person.id === currentUserId);

  const close = () => setOpen(false);

  return (
    <>
      <Pressable
        style={[styles.bar, { paddingTop: insets.top + 6 }]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Dev mode: switch profile"
      >
        <Text style={styles.tag}>DEV MODE</Text>
        <Text style={styles.viewing} numberOfLines={1}>
          {me ? `Viewing as ${me.name}` : 'Signed out'} ▾
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          {/* Inner Pressable swallows taps so only the backdrop closes it. */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>View as…</Text>
            <ScrollView style={styles.list}>
              {members.map((person) => {
                const selected = person.id === currentUserId;

                return (
                  <Pressable
                    key={person.id}
                    style={[styles.row, selected && styles.rowSelected]}
                    onPress={() => {
                      onChoose(person.id);
                      close();
                    }}
                  >
                    <Text style={[styles.rowName, selected && styles.rowNameSelected]}>
                      {person.name}
                    </Text>
                    <Text style={[styles.rowMeta, selected && styles.rowNameSelected]}>
                      {person.city}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              style={styles.signOut}
              onPress={() => {
                onSignOut();
                close();
              }}
            >
              <Text style={styles.signOutText}>Sign out (see the welcome screen)</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.text,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  tag: {
    color: theme.colors.text,
    // Off-palette on purpose, so it can't be mistaken for part of the app.
    backgroundColor: '#f2c94c',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  viewing: {
    flex: 1,
    color: theme.colors.card,
    fontSize: 13,
    fontWeight: '600',
  },
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
    maxHeight: '80%',
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 18,
  },
  sheetTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rowSelected: {
    backgroundColor: theme.colors.accent,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  rowNameSelected: {
    color: theme.colors.onAccent,
  },
  rowMeta: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  signOut: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  signOutText: {
    color: theme.colors.muted,
    fontWeight: '700',
    fontSize: 13,
  },
});
