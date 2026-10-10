import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme';
import { tagline } from '../content/about';
import { EmailAction, previewEmailAction, redeemEmailAction } from '../lib/bookClubService';
import { bookLink } from '../lib/links';

type Outcome = 'done' | 'already' | 'expired' | 'unknown' | 'retry';

/**
 * Where an email button lands. It asks before acting, because mail scanners
 * open links on their own; no sign-in needed, the link itself is the key.
 */
export function EmailActionScreen({ token, onClose }: { token: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [preview, setPreview] = useState<EmailAction | null>(null);
  const [working, setWorking] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  useEffect(() => {
    previewEmailAction(token).then(setPreview);
  }, [token]);

  const confirm = async () => {
    setWorking(true);
    try {
      setOutcome((await redeemEmailAction(token)) as Outcome);
    } catch {
      setOutcome('retry');
    }
    setWorking(false);
  };

  const open = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && preview?.bookId) {
      window.location.assign(bookLink(preview.bookId));
      return;
    }
    onClose();
  };

  const title = preview?.title ?? 'the book';
  const about = preview?.about ?? 'them';
  const ask = {
    got_it: { heading: `Has ${title} arrived?`, body: `${about} will know it made it.`, button: "Got it, it's here" },
    accept_friend: { heading: `Be friends with ${about}?`, body: 'Friends see what each other is reading.', button: 'Accept' },
    join_line: { heading: `Join the line for ${title}?`, body: `${about} is lending it. It comes to you in turn.`, button: 'Join the line' },
  }[preview?.action ?? 'join_line'];
  const result: Record<Outcome, { heading: string; body: string }> = {
    done: {
      got_it: { heading: 'Got it!', body: `${about} will see that ${title} made it to you. Happy reading.` },
      accept_friend: { heading: `You and ${about} are friends`, body: "You'll see what each other is reading." },
      join_line: { heading: `You're in line for ${title}`, body: "We'll email you when you're next." },
    }[preview?.action ?? 'join_line'],
    already: { heading: 'All set', body: 'This one is already taken care of.' },
    expired: { heading: 'This link has had its day', body: 'Open the club to pick up where you left off.' },
    unknown: { heading: 'This link has wandered off', body: 'Open the club to pick up where you left off.' },
    retry: { heading: 'One more try', body: 'Give it another tap and it should go through.' },
  };
  const state = outcome ?? (preview && preview.state !== 'ready' ? (preview.state === 'used' ? 'already' : preview.state) : null);
  const shown = state ? result[state] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}>
      <Text style={styles.title}>Sisterhood of the Traveling Books</Text>
      <Text style={styles.subtitle}>{tagline}</Text>

      <View style={styles.card}>
        {!preview ? (
          <ActivityIndicator color={theme.colors.accent} />
        ) : shown && state !== 'retry' ? (
          <>
            <Text style={styles.cardTitle}>{shown.heading}</Text>
            <Text style={styles.body}>{shown.body}</Text>
            <Pressable style={styles.primaryButton} onPress={open} accessibilityRole="button">
              <Text style={styles.primaryButtonText}>Open the club</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.cardTitle}>{shown?.heading ?? ask.heading}</Text>
            <Text style={styles.body}>{shown?.body ?? ask.body}</Text>
            <Pressable
              style={[styles.primaryButton, working && styles.disabled]}
              disabled={working}
              onPress={confirm}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>{working ? 'One moment…' : ask.button}</Text>
            </Pressable>
          </>
        )}
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
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.muted,
    marginBottom: 16,
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
});
