import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme';
import { authorName, face, noteTitle } from '../content/about';
import { loadLetterOpened, saveLetterOpened } from '../lib/identity';
import { AboutSheet } from './AboutSheet';

type LetterFromIreneProps = {
  /**
   * Books passes true: once this device has opened the letter, the envelope
   * steps aside there (the byline at the foot of the page still leads to it).
   * Everywhere else it stays.
   */
  hideOnceOpened?: boolean;
};

/**
 * Irene's note about why this exists, dressed as what the app is about: a
 * letter tucked in for the next reader. A sealed envelope with her face as
 * the stamp is hard to scroll past without wondering what's inside.
 */
export function LetterFromIrene({ hideOnceOpened = false }: LetterFromIreneProps) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState<boolean | null>(hideOnceOpened ? null : false);

  useEffect(() => {
    if (hideOnceOpened) {
      loadLetterOpened().then(setOpened);
    }
  }, [hideOnceOpened]);

  // Wait to know before showing anything, so it doesn't flash and vanish.
  if (opened === null || (hideOnceOpened && opened && !open)) {
    return null;
  }

  return (
    <>
      <Pressable
        style={styles.envelope}
        onPress={() => {
          setOpen(true);
          setOpened(true);
          saveLetterOpened();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Open the ${noteTitle.toLowerCase()} from ${authorName}`}
      >
        {/* The flap: a fold line across the top of the envelope. */}
        <View style={styles.flap} />
        <View style={styles.body}>
          <View style={styles.text}>
            <Text style={styles.kicker}>{opened ? 'Read again' : 'For you'}</Text>
            <Text style={styles.title}>{noteTitle}</Text>
            <Text style={styles.subtitle}>The Rules of the Books, and why I made this.</Text>
          </View>
          {face ? (
            <View style={styles.stamp}>
              <Image source={face} style={styles.stampImage} />
            </View>
          ) : null}
        </View>
        <View style={styles.footer}>
          <Ionicons name="mail-open-outline" size={15} color={theme.colors.accent} />
          <Text style={styles.open}>Open it</Text>
        </View>
      </Pressable>
      <AboutSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  envelope: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  flap: {
    height: 6,
    backgroundColor: theme.colors.soft,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  text: {
    flex: 1,
    paddingRight: 12,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.muted,
    marginBottom: 4,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.muted,
    marginTop: 4,
  },
  // A postage stamp: white border, slight tilt, the photo inside.
  stamp: {
    padding: 3,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.faint,
    transform: [{ rotate: '4deg' }],
  },
  stampImage: {
    width: 52,
    height: 60,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  open: {
    marginLeft: 6,
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});
