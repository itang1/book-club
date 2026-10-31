import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '../theme';
import { Letterhead } from '../components/Letterhead';
import { emailSignInLink } from '../lib/auth';
import { groupPreview } from '../lib/bookClubService';
import { inviteCodeFromUrl } from '../lib/invite';
import { privacyLink } from '../lib/links';

/** A new email simply gets an account, so this covers first-timers too. */
export function SignInScreen() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [invitedTo, setInvitedTo] = useState<{ name: string; members: number } | null>(null);
  useEffect(() => {
    const code = inviteCodeFromUrl();
    if (code) {
      groupPreview(code).then((group) => group && setInvitedTo(group));
    }
  }, []);

  const valid = /\S+@\S+\.\S+/.test(email.trim());

  const send = async () => {
    if (!valid || sending) {
      return;
    }

    setSending(true);
    setProblem(null);
    const error = await emailSignInLink(email);
    setSending(false);
    if (error) {
      setProblem(error);
    } else {
      setSentTo(email.trim());
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Letterhead />
      <View style={styles.content}>
        {invitedTo && (
          <View style={styles.invite}>
            <Ionicons name="people" size={18} color={theme.colors.accent} />
            <Text style={styles.inviteText}>
              You're invited to <Text style={styles.inviteName}>{invitedTo.name}</Text>
              {invitedTo.members > 0
                ? ` (${invitedTo.members} ${invitedTo.members === 1 ? 'member' : 'members'})`
                : ''}
              . Sign in or create an account below to join.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          {sentTo ? (
            <>
              <Text style={styles.cardTitle}>Check your email</Text>
              <Text style={styles.body}>
                We sent a link to {sentTo}. Open it on this device and you'll land back here, signed
                in. New accounts are set up as you arrive.
              </Text>
              <Pressable onPress={() => setSentTo(null)}>
                <Text style={styles.link}>Use a different email</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Sign in or create an account</Text>
              <Text style={styles.body}>
                Enter your email and we'll send you a link. If you're new, the same link sets up
                your account.
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={send}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.faint}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                style={styles.input}
              />
              <Pressable
                style={[styles.primaryButton, (!valid || sending) && styles.disabled]}
                disabled={!valid || sending}
                onPress={send}
              >
                <Text style={styles.primaryButtonText}>
                  {sending ? 'Sending…' : 'Email me a link'}
                </Text>
              </Pressable>
              <Text style={styles.fine}>
                No password, now or ever. Read how we look after your details in the{' '}
                <Text
                  style={styles.inlineLink}
                  accessibilityRole="link"
                  onPress={() => Linking.openURL(privacyLink())}
                >
                  privacy policy
                </Text>
                .
              </Text>
              {problem && <Text style={styles.problem}>{problem}</Text>}
            </>
          )}
        </View>

        <Text style={styles.footnote}>
          One copy of a book travels around a group of friends, one reader at a time, and the app
          keeps track of where it is and everywhere it's been.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
  },
  inlineLink: {
    color: theme.colors.accent,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  fine: {
    marginTop: 10,
    fontSize: 12,
    color: theme.colors.muted,
  },
  footnote: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: 22,
    paddingHorizontal: 12,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 24,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.soft,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.brass,
    borderRadius: theme.radius.sm,
    padding: 14,
    marginBottom: 16,
  },
  inviteText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.text,
  },
  inviteName: {
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    borderTopWidth: 3,
    borderTopColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    padding: 20,
  },
  cardTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.muted,
    marginBottom: 14,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    borderRadius: theme.radius.sm,
    padding: 12,
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    ...theme.caps,
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 13,
  },
  problem: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  link: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});
