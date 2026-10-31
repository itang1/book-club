import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Book } from '../types';
import { theme } from '../theme';
import { clubYear, type ClubYear } from '../lib/stats';
import { YearInReviewSheet } from './YearInReviewSheet';

/** `slim` is a single line, for when your own books need the room. */
export function ClubYearCard({
  books,
  groupNames,
  currentUserId,
  slim = false,
  now = new Date(),
}: {
  /** Your real groups' books only. */
  books: Book[];
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
    { label: 'Notes', value: year.letters },
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
            : `${count(year.handoffs, 'handoff')} · ${count(year.letters, 'note')} · ${count(year.places, 'place')}`}
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
              <Text style={styles.label}>{tile.label}</Text>
              <View style={styles.leader} />
              <Text style={styles.value}>{tile.value}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.note}>
        {december ? 'Your year in books is ready. ' : ''}
        <Text style={styles.link}>{december ? 'Open it →' : 'See the year so far →'}</Text>
      </Text>
      {sheet}
    </Pressable>
  );
}

/** Below this many handoffs, a sentence says it better than tiles. */
const EARLY_BELOW = 4;

function earlyLine(year: ClubYear): string {
  if (year.handoffs === 0) {
    return 'a fresh year, ready for its first book';
  }
  const moving = `${count(year.booksMoving, 'book')} on the move`;
  return year.letters > 0 ? `${moving} and ${count(year.letters, 'note')}` : moving;
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
    fontFamily: theme.fonts.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 2,
    marginBottom: 14,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    borderRadius: theme.radius.md,
    padding: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.text,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 24,
    rowGap: 6,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexBasis: '42%',
    flexGrow: 1,
  },
  leader: {
    flex: 1,
    borderBottomWidth: 1.5,
    borderStyle: 'dotted',
    borderBottomColor: theme.colors.faint,
    marginHorizontal: 6,
    marginBottom: 5,
  },
  value: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  label: {
    fontSize: 14,
    color: theme.colors.muted,
    marginBottom: 2,
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
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginRight: 12,
  },
  slimStats: {
    flex: 1,
    ...theme.caps,
    fontSize: 12,
    color: theme.colors.muted,
  },
  link: {
    color: theme.colors.accent,
    fontWeight: '700',
  },
  note: {
    fontSize: 14,
    lineHeight: 18,
    color: theme.colors.muted,
    marginTop: 14,
  },
});
