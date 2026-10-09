import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';
import { authorName, face, noteTitle } from '../content/about';
import { AboutSheet } from './AboutSheet';

/**
 * A maker's mark at the foot of a page, like the colophon in the back of a
 * book: findable by anyone who scrolls that far, never in the way. Opens the
 * About page.
 */
export function Byline() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        style={styles.row}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`About this app and ${authorName}`}
      >
        {face ? (
          <Image source={face} style={styles.face} />
        ) : (
          <View style={[styles.face, styles.facePlaceholder]} />
        )}
        <Text style={styles.text}>
          <Text style={styles.link}>{noteTitle}</Text> · {authorName}
        </Text>
      </Pressable>
      <AboutSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 8,
  },
  face: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
  facePlaceholder: {
    backgroundColor: theme.colors.avatar,
  },
  text: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
  },
  link: {
    color: theme.colors.accent,
    fontWeight: '700',
  },
});
