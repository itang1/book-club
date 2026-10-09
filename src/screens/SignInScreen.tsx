import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme';
import { emailSignInLink } from '../lib/auth';
import { LetterFromIrene } from '../components/LetterFromIrene';

/**
 * Sign in with an emailed link. The same screen covers first-timers: a new
 * email simply gets an account, and the welcome screen follows.
 */
export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Sisterhood of the Traveling Books</Text>
      <Text style={styles.subtitle}>
        The pants fit everyone. So does a good book.
      </Text>

      <View style={styles.card}>
        {sentTo ? (
          <>
            <Text style={styles.cardTitle}>Check your email</Text>
            <Text style={styles.body}>
              We sent a sign-in link to {sentTo}. Open it on this device and you'll land
              back here, signed in.
            </Text>
            <Pressable onPress={() => setSentTo(null)}>
              <Text style={styles.link}>Use a different email</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.body}>
              No password. We'll email you a link; new here is fine too.
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
                {sending ? 'Sending…' : 'Email me a sign-in link'}
              </Text>
            </Pressable>
            {problem && <Text style={styles.problem}>{problem}</Text>}
          </>
        )}
      </View>

      {/* Right where people wait for their email, with nothing else to do. */}
      <View style={styles.letter}>
        <LetterFromIrene />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.muted,
    marginBottom: 24,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 18,
  },
  cardTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
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
    backgroundColor: theme.colors.soft,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 15,
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
  letter: {
    marginTop: 20,
  },
});
