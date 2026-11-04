import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Friend, Group } from '../types';
import { theme } from '../theme';

type Props = {
  group: Group;
  /** Everyone in the group but you. */
  others: Friend[];
  onRename: (name: string) => void;
  onRemove: (personId: string) => void;
  onHandOver: (personId: string) => void;
  onResetInvite: () => void;
  onSetPace: (weeks: number | null) => void;
};

const PACES: (number | null)[] = [null, 2, 3, 4, 6, 8];

/** One thing at a time waits for a yes: which, and about whom. */
type Pending =
  | { kind: 'remove'; person: Friend }
  | { kind: 'handOver'; person: Friend }
  | { kind: 'reset' }
  | null;

/**
 * For whoever runs the group: rename it, remove someone, hand it over, or
 * reset the invite link if it's been shared too widely. Anything that can't
 * be taken back asks first.
 */
export function GroupAdminPanel({
  group,
  others,
  onRename,
  onRemove,
  onHandOver,
  onResetInvite,
  onSetPace,
}: Props) {
  const [name, setName] = useState(group.name);
  const [pending, setPending] = useState<Pending>(null);
  const [resetDone, setResetDone] = useState(false);
  const renamed = name.trim() !== '' && name.trim() !== group.name;

  const confirm = () => {
    if (!pending) {
      return;
    }
    if (pending.kind === 'remove') {
      onRemove(pending.person.id);
    } else if (pending.kind === 'handOver') {
      onHandOver(pending.person.id);
    } else {
      onResetInvite();
      setResetDone(true);
    }
    setPending(null);
  };

  const question = !pending
    ? null
    : pending.kind === 'remove'
      ? `Remove ${pending.person.name} from ${group.name}? They'll stop seeing its books and come off any lines they're waiting in. A book they have stays with them until they pass it on.`
      : pending.kind === 'handOver'
        ? `Hand ${group.name} to ${pending.person.name}? They'll run it from now on, and you'll be a member like everyone else.`
        : 'Reset the invite link? The old link stops working at once; anyone already in the group stays in.';

  return (
    <View>
      <Text style={styles.heading}>Running the group</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <View style={styles.renameRow}>
          <TextInput
            accessibilityLabel="Group name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={() => renamed && onRename(name)}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!renamed}
            onPress={() => onRename(name)}
            style={[styles.button, !renamed && styles.disabled]}
          >
            <Text style={styles.buttonText}>Save</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Pace</Text>
        <Text style={styles.note}>
          About how long each reader keeps a copy. Whoever has it sees how far along they are;
          nothing is enforced.
        </Text>
        <View style={styles.chips}>
          {PACES.map((weeks) => {
            const chosen = (group.paceWeeks ?? null) === weeks;
            return (
              <Pressable
                key={weeks ?? 'none'}
                accessibilityRole="button"
                accessibilityState={{ selected: chosen }}
                accessibilityLabel={weeks ? `About ${weeks} weeks each` : 'No set pace'}
                onPress={() => onSetPace(weeks)}
                style={[styles.chip, chosen && styles.chipChosen]}
              >
                <Text style={[styles.chipText, chosen && styles.chipTextChosen]}>
                  {weeks ? `${weeks} wk` : 'None'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {others.length > 0 && (
          <>
            <Text style={styles.label}>Members</Text>
            {others.map((person) => (
              <View key={person.id} style={styles.personRow}>
                <Text style={styles.personName} numberOfLines={1}>
                  {person.name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Hand the group to ${person.name}`}
                  onPress={() => setPending({ kind: 'handOver', person })}
                  style={styles.link}
                >
                  <Text style={styles.linkText}>Hand over</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${person.name} from the group`}
                  onPress={() => setPending({ kind: 'remove', person })}
                  style={styles.link}
                >
                  <Text style={styles.linkText}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}

        <Text style={styles.label}>Invite link</Text>
        <Text style={styles.note}>
          {resetDone
            ? 'Done: the old link no longer works. Share the new one from Invite above.'
            : 'If the link has gone further than you meant, reset it. Members stay; only the link changes.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setPending({ kind: 'reset' })}
          style={[styles.link, styles.resetLink]}
        >
          <Text style={styles.linkText}>Reset invite link</Text>
        </Pressable>

        {question && (
          <View style={styles.confirm} accessibilityLiveRegion="polite">
            <Text style={styles.confirmText}>{question}</Text>
            <View style={styles.confirmButtons}>
              <Pressable accessibilityRole="button" style={styles.button} onPress={confirm}>
                <Text style={styles.buttonText}>
                  {pending?.kind === 'remove'
                    ? 'Remove'
                    : pending?.kind === 'handOver'
                      ? 'Hand over'
                      : 'Reset'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.cancel}
                onPress={() => setPending(null)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 22,
    marginBottom: 10,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 16,
  },
  label: {
    ...theme.caps,
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 6,
    marginBottom: 8,
  },
  renameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  input: {
    flex: 1,
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radius.md,
    padding: 10,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  disabled: { opacity: 0.4 },
  buttonText: { ...theme.caps, color: theme.colors.onAccent, fontWeight: '700', fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, marginTop: 4 },
  chip: {
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipChosen: { backgroundColor: theme.colors.accent },
  chipText: { fontSize: 13, fontWeight: '700', color: theme.colors.accent },
  chipTextChosen: { color: theme.colors.onAccent },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.rule,
  },
  personName: { flex: 1, fontSize: 15, color: theme.colors.text },
  link: { paddingHorizontal: 8, paddingVertical: 4 },
  resetLink: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  linkText: { fontSize: 14, fontWeight: '700', color: theme.colors.accent },
  note: { color: theme.colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 4 },
  confirm: {
    marginTop: 14,
    padding: 12,
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radius.md,
  },
  confirmText: { fontSize: 14, lineHeight: 20, color: theme.colors.text, marginBottom: 10 },
  confirmButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancel: { paddingHorizontal: 12, paddingVertical: 8 },
  cancelText: { ...theme.caps, color: theme.colors.muted, fontWeight: '700', fontSize: 12 },
});
