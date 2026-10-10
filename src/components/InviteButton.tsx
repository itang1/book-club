import { useState } from 'react';
import { Modal, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Group } from '../types';
import { theme } from '../theme';
import { inviteLink } from '../lib/invite';

/** Copy text where the platform allows; false if it couldn't. */
async function copy(text: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through: the link is on screen to copy by hand.
  }
  return false;
}

/**
 * "Invite to Living Room": opens a card with the group's link, Copy and
 * Share, and what the person will see when they open it, so inviting is
 * one tap and nobody has to explain the app over text.
 */
export function InviteButton({ group, compact = false }: { group: Group; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const link = group.inviteCode ? inviteLink(group.inviteCode) : null;
  const message = link
    ? `Come pass books around with me in ${group.name} on Sisterhood of the Traveling Books: ${link}`
    : '';

  const close = () => {
    setOpen(false);
    setCopied(false);
  };

  return (
    <>
      <Pressable
        style={compact ? styles.compactButton : styles.button}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Invite someone to ${group.name}`}
      >
        <Ionicons
          name="person-add-outline"
          size={compact ? 14 : 15}
          color={compact ? theme.colors.accent : theme.colors.onAccent}
        />
        <Text style={compact ? styles.compactText : styles.buttonText}>
          {compact ? 'Invite' : `Invite to ${group.name}`}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Invite someone to {group.name}</Text>

            {link ? (
              <>
                <View style={styles.linkBox}>
                  <Text style={styles.link} selectable numberOfLines={2}>
                    {link}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    style={styles.primary}
                    onPress={async () => setCopied(await copy(message))}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={copied ? 'checkmark' : 'copy-outline'}
                      size={16}
                      color={theme.colors.onAccent}
                    />
                    <Text style={styles.primaryText}>{copied ? 'Copied' : 'Copy invite'}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondary}
                    onPress={async () => {
                      try {
                        await Share.share({ message });
                      } catch {
                        setCopied(await copy(message));
                      }
                    }}
                    accessibilityRole="button"
                  >
                    <Ionicons name="share-outline" size={16} color={theme.colors.accent} />
                    <Text style={styles.secondaryText}>Share…</Text>
                  </Pressable>
                </View>
                {copied && (
                  <Text style={styles.copiedNote}>
                    Copied with a short note. Paste it into a text or email.
                  </Text>
                )}

                <Text style={styles.stepsTitle}>What they'll see</Text>
                {[
                  'They open the link and sign in with their email. No password.',
                  "If you've already added them, they tap their name. Otherwise they make a profile.",
                  `They're in ${group.name}: they can see its books and join their lines.`,
                ].map((step, index) => (
                  <View key={step} style={styles.step}>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
                <Text style={styles.warning}>
                  Anyone with this link can join, so send it only to people you mean to invite.
                </Text>
              </>
            ) : (
              <Text style={styles.stepText}>The invite link appears in a moment.</Text>
            )}

            <Pressable style={styles.done} onPress={close} accessibilityRole="button">
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  buttonText: {
    marginLeft: 6,
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 14,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  compactText: {
    marginLeft: 5,
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 26, 23, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 22,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 21,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 14,
  },
  linkBox: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: 12,
  },
  link: {
    fontSize: 13,
    color: theme.colors.text,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  primary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    marginRight: 8,
  },
  primaryText: {
    marginLeft: 6,
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 15,
  },
  secondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 11,
  },
  secondaryText: {
    marginLeft: 6,
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  copiedNote: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 8,
  },
  stepsTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.muted,
    marginTop: 20,
    marginBottom: 8,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stepNumber: {
    width: 20,
    fontFamily: theme.fonts.serif,
    fontWeight: '700',
    fontSize: 15,
    color: theme.colors.accent,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  warning: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
    marginTop: 6,
  },
  done: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  doneText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
});
