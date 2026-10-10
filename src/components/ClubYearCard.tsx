import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Book } from '../types';
import { theme } from '../theme';
import { clubYear, type ClubYear } from '../lib/stats';
import { YearInReviewSheet } from './YearInReviewSheet';

/**
 * The club's year so far, as a row of stat tiles. Tap for the year in
 * books; in December the card says it's ready.
 *
 * Early in a year (a few handoffs at most) it says what's moving in a
 * sentence instead of tiles of small numbers. The words stay upbeat: it's a
 * start, never a shortfall. `slim` is a single line, for when your own books need the
 * room at the top of the screen.
 */
export function ClubYearCard({
  books,
  groupNames,
  currentUserId,
  slim = false,
  now = new Date(),
}: {
  /** Your real groups' books only. */
  books: Book[];
  /** The groups those are, to say so. At least one. */
  groupNames: string[];
  currentUserId: string | null;
  slim?: boolean;
  now?: Date;
}) {
  const [open, setOpen] = useState(false);
  const year = clubYear(books, now.getFullYear());
  const december = now.getMonth() === 11;
  const early = year.handoffs < EARLY_BELOW;
  const tiles = [
    { label: 'Handoffs', value: year.handoffs },
    { label: 'Letters', value: year.letters },
    { label: 'Readers', value: year.readers },
    { label: 'Places', value: year.places },
  ];
  const sheet = (
    <YearInReviewSheet
      visible={open}
      onClose={() => setOpen(false)}
      books={books}
      currentUserId={currentUserId}
      year={year.year}
    />
  );

  if (slim) {
    return (
      <Pressable
        style={[styles.card, styles.slimCard]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Your groups in ${year.year}`}
      >
        <Text style={styles.slimTitle}>{year.year}</Text>
        <Text style={styles.slimStats} numberOfLines={1}>
          {early
            ? earlyLine(year)
            : `${count(year.handoffs, 'handoff')} · ${count(year.letters, 'letter')} · ${count(year.places, 'place')}`}
        </Text>
        <Text style={styles.link}>›</Text>
        {sheet}
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.card} onPress={() => setOpen(true)} accessibilityRole="button">
      <Text style={styles.title}>Your groups in {year.year}</Text>
      <Text style={styles.scope}>{listOf(groupNames)}, so far this year.</Text>
      {early ? (
        <Text style={styles.early}>
          {year.handoffs === 0
            ? 'A fresh year of books begins with the first one you lend.'
            : `Off to a good start: ${earlyLine(year)}.`}
        </Text>
      ) : (
        <View style={styles.tiles}>
          {tiles.map((tile) => (
            <View key={tile.label} style={styles.tile}>
              <Text style={styles.value}>{tile.value}</Text>
              <Text style={styles.label}>{tile.label}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.note}>
        {december ? 'Your year in books is ready. ' : ''}
        <Text style={styles.link}>{december ? 'Open it' : 'See the year so far'}</Text>
      </Text>
      {sheet}
    </Pressable>
  );
}

/** Below this many handoffs, a sentence says it better than tiles. */
const EARLY_BELOW = 4;

/** "2 books on the move and 1 letter", or "a fresh year" before any. */
function earlyLine(year: ClubYear): string {
  if (year.handoffs === 0) {
    return 'a fresh year, ready for its first book';
  }
  const moving = `${count(year.booksMoving, 'book')} on the move`;
  return year.letters > 0 ? `${moving} and ${count(year.letters, 'letter')}` : moving;
}

function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

/** "A", "A and B", "A, B and C". */
function listOf(names: string[]): string {
  return names.length <= 1
    ? names.join('')
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

const styles = StyleSheet.create({
  scope: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: -8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    marginBottom: 20,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  tiles: {
    flexDirection: 'row',
  },
  tile: {
    flex: 1,
  },
  // Stat values in the sans, per the figure spec; the serif stays on titles.
  value: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
  },
  label: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2,
  },
  early: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  slimCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  slimTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginRight: 10,
  },
  slimStats: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.muted,
  },
  link: {
    color: theme.colors.accent,
    fontWeight: '700',
  },
  note: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
    marginTop: 12,
  },
});
