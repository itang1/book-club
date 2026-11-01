import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Friend } from '../types';
import { theme } from '../theme';
import { REPORT_REASONS, type Blocks, type ReportReason } from '../lib/blocks';

type Props = {
  /** Who the sheet is about; null keeps it closed. */
  person: Friend | null;
  blocks: Blocks;
  /** Offered only when you're friends. */
  onUnfriend?: () => void;
  /** After a block, so the screen can drop the friendship too. */
  onBlocked?: (personId: string) => void;
  onClose: () => void;
};

type Step = 'menu' | 'block' | 'report' | 'reported';

/** Unfriend, block or report someone: the "..." on a person. */
export function PersonSafetySheet(props: Props) {
  // A fresh sheet for each person, so a half-written report doesn't carry over.
  return <SafetySheet key={props.person?.id ?? 'closed'} {...props} />;
}

function SafetySheet({ person, blocks, onUnfriend, onBlocked, onClose }: Props) {
  const [step, setStep] = useState<Step>('menu');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (!person) {
    return null;
  }
  const first = person.name.split(' ')[0];
  const blocked = blocks.blockedIds.includes(person.id);

  const run = async (action: () => Promise<string | null>, then: () => void) => {
    setSending(true);
    const failure = await action();
    setSending(false);
    if (failure) {
      setProblem(failure);
      return;
    }
    setProblem(null);
    then();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          {step === 'menu' && (
            <>
              <Text style={styles.title}>{person.name}</Text>
              {onUnfriend && (
                <Pressable
                  accessibilityRole="button"
                  style={styles.option}
                  onPress={() => {
                    onUnfriend();
                    onClose();
                  }}
                >
                  <Text style={styles.optionText}>Unfriend</Text>
                  <Text style={styles.optionNote}>
                    Private. You'll keep sharing any groups you're both in.
                  </Text>
                </Pressable>
              )}
              {blocked ? (
                <Pressable
                  accessibilityRole="button"
                  style={styles.option}
                  disabled={sending}
                  onPress={() => run(() => blocks.unblock(person.id), onClose)}
                >
                  <Text style={styles.optionText}>Unblock {first}</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  style={styles.option}
                  onPress={() => setStep('block')}
                >
                  <Text style={styles.optionText}>Block {first}</Text>
                  <Text style={styles.optionNote}>No more friend requests or asks to borrow.</Text>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                style={styles.option}
                onPress={() => setStep('report')}
              >
                <Text style={styles.optionText}>Report {first}</Text>
                <Text style={styles.optionNote}>Tell whoever looks after The Traveling Books.</Text>
              </Pressable>
            </>
          )}

          {step === 'block' && (
            <>
              <Text style={styles.title}>Block {first}?</Text>
              <Text style={styles.note}>
                {first} won't be able to ask you to be friends or ask to borrow from your shelf, and
                won't see your shelf. If you're friends, that ends. {first} isn't told. You'll still
                both be in any groups you share: whoever runs a group can remove someone.
              </Text>
              <Pressable
                accessibilityRole="button"
                style={styles.danger}
                disabled={sending}
                onPress={() =>
                  run(
                    () => blocks.block(person.id),
                    () => {
                      onBlocked?.(person.id);
                      onClose();
                    },
                  )
                }
              >
                <Text style={styles.dangerText}>Block</Text>
              </Pressable>
            </>
          )}

          {step === 'report' && (
            <>
              <Text style={styles.title}>Report {first}</Text>
              <Text style={styles.note}>
                Only the person who looks after The Traveling Books sees this. {first} isn't told.
              </Text>
              {REPORT_REASONS.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: reason === option.value }}
                  style={[styles.reason, reason === option.value && styles.reasonChosen]}
                  onPress={() => setReason(option.value)}
                >
                  <Text
                    style={[styles.reasonText, reason === option.value && styles.reasonTextChosen]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
              <TextInput
                accessibilityLabel="What happened (optional)"
                value={details}
                onChangeText={setDetails}
                placeholder="What happened (optional)"
                placeholderTextColor={theme.colors.faint}
                style={styles.input}
                multiline
                maxLength={2000}
              />
              <Pressable
                accessibilityRole="button"
                style={[styles.danger, (!reason || sending) && styles.disabled]}
                disabled={!reason || sending}
                onPress={() =>
                  reason &&
                  run(
                    () => blocks.report(person.id, reason, details),
                    () => setStep('reported'),
                  )
                }
              >
                <Text style={styles.dangerText}>Send report</Text>
              </Pressable>
            </>
          )}

          {step === 'reported' && (
            <>
              <Text style={styles.title}>Thanks for telling us.</Text>
              <Text style={styles.note}>
                Someone will look at it soon.
                {blocked
                  ? ''
                  : ` If you'd rather not hear from ${first} meanwhile, you can block them.`}
              </Text>
              {!blocked && (
                <Pressable
                  accessibilityRole="button"
                  style={styles.danger}
                  onPress={() => setStep('block')}
                >
                  <Text style={styles.dangerText}>Block {first}</Text>
                </Pressable>
              )}
            </>
          )}

          {problem && <Text style={styles.problem}>Couldn't do that: {problem}</Text>}
          <Pressable accessibilityRole="button" style={styles.plain} onPress={onClose}>
            <Text style={styles.plainText}>{step === 'reported' ? 'Done' : 'Cancel'}</Text>
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
    maxWidth: 400,
    backgroundColor: theme.colors.card,
    borderTopWidth: 4,
    borderTopColor: theme.colors.letterhead,
    borderRadius: theme.radius.md,
    padding: 22,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 21,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  note: { color: theme.colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 14 },
  option: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.rule,
  },
  optionText: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  optionNote: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  reason: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  reasonChosen: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accent },
  reasonText: { fontSize: 14, color: theme.colors.text },
  reasonTextChosen: { color: theme.colors.onAccent, fontWeight: '700' },
  input: {
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radius.md,
    padding: 10,
    minHeight: 70,
    color: theme.colors.text,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  danger: {
    borderWidth: 1.5,
    borderColor: theme.colors.text,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerText: { ...theme.caps, color: theme.colors.text, fontWeight: '700', fontSize: 12 },
  disabled: { opacity: 0.4 },
  problem: { fontSize: 13, color: theme.colors.stamp, marginTop: 10 },
  plain: { marginTop: 6, paddingVertical: 10, alignItems: 'center' },
  plainText: { ...theme.caps, color: theme.colors.muted, fontWeight: '700', fontSize: 12 },
});
