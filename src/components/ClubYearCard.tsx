import { StyleSheet, Text, View } from 'react-native';

import { Book } from '../types';
import { theme } from '../theme';
import { clubYear } from '../lib/stats';

/**
 * The club's year so far, as a row of stat tiles. A preview of the year in
 * review: the numbers are live now, and the full look-back opens in December.
 */
export function ClubYearCard({ books, now = new Date() }: { books: Book[]; now?: Date }) {
  const year = clubYear(books, now.getFullYear());
  const tiles = [
    { label: 'Handoffs', value: year.handoffs },
    { label: 'Letters', value: year.letters },
    { label: 'Readers', value: year.readers },
    { label: 'Places', value: year.places },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>The club's {year.year}</Text>
      <View style={styles.tiles}>
        {tiles.map((tile) => (
          <View key={tile.label} style={styles.tile}>
            <Text style={styles.value}>{tile.value}</Text>
            <Text style={styles.label}>{tile.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>
        {now.getMonth() === 11
          ? 'Your year in books is ready.'
          : 'The full year in books, with who read the most and where it all went, arrives in December.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  note: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
    marginTop: 12,
  },
});
