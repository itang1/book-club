import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Book } from '../types';
import { theme } from '../theme';
import { clubYear } from '../lib/stats';
import { YearInReviewSheet } from './YearInReviewSheet';

/**
 * The club's year so far, as a row of stat tiles. Tap for the year in
 * books; in December the card says it's ready.
 */
export function ClubYearCard({
  books,
  groupNames,
  currentUserId,
  now = new Date(),
}: {
  /** Your real groups' books only. */
  books: Book[];
  /** The groups those are, to say so. */
  groupNames: string[];
  currentUserId: string | null;
  now?: Date;
}) {
  const [open, setOpen] = useState(false);
  const year = clubYear(books, now.getFullYear());
  const tiles = [
    { label: 'Handoffs', value: year.handoffs },
    { label: 'Letters', value: year.letters },
    { label: 'Readers', value: year.readers },
    { label: 'Places', value: year.places },
  ];

  return (
    <Pressable style={styles.card} onPress={() => setOpen(true)} accessibilityRole="button">
      <Text style={styles.title}>Your groups in {year.year}</Text>
      <Text style={styles.scope}>
        {groupNames.length === 0
          ? 'Once you join a group, its year shows up here.'
          : `${listOf(groupNames)}, so far this year.`}
      </Text>
      <View style={styles.tiles}>
        {tiles.map((tile) => (
          <View key={tile.label} style={styles.tile}>
            <Text style={styles.value}>{tile.value}</Text>
            <Text style={styles.label}>{tile.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>
        {now.getMonth() === 11 ? 'Your year in books is ready. ' : ''}
        <Text style={styles.link}>
          {now.getMonth() === 11 ? 'Open it' : 'See the year so far'}
        </Text>
      </Text>
      <YearInReviewSheet
        visible={open}
        onClose={() => setOpen(false)}
        books={books}
        currentUserId={currentUserId}
        year={year.year}
      />
    </Pressable>
  );
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
    marginTop: 8,
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
