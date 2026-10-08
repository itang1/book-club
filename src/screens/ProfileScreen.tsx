import { StyleSheet, Text, View } from 'react-native';

import { Book } from '../types';
import { theme } from '../theme';

type ProfileScreenProps = {
  books: Book[];
};

export function ProfileScreen({ books }: ProfileScreenProps) {
  const booksSent = books.length;
  const booksWaiting = books.filter((book) => book.status === 'in-transit').length;
  const notesTotal = books.reduce((sum, book) => sum + book.notesCount, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your profile</Text>
      <Text style={styles.subtitle}>Reading stats and mailing details.</Text>

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{booksSent}</Text>
          <Text style={styles.statLabel}>Books sent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{books.length > 0 ? books.length + 2 : 0}</Text>
          <Text style={styles.statLabel}>Friends in circle</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{booksWaiting}</Text>
          <Text style={styles.statLabel}>Books waiting</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round((notesTotal / Math.max(booksSent, 1)) * 10) / 10}</Text>
          <Text style={styles.statLabel}>Avg notes/book</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statLabel: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.muted,
  },
});
