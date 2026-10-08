import { StyleSheet, Text, View } from 'react-native';

import { Book, Friend } from '../types';
import { theme } from '../theme';

type ProfileScreenProps = {
  books: Book[];
  friends: Friend[];
};

export function ProfileScreen({ books, friends }: ProfileScreenProps) {
  const booksInCirculation = books.length;
  const booksInTransit = books.filter((book) => book.status === 'in-transit').length;
  const booksBeingRead = books.filter((book) => book.status === 'reading').length;
  const notesTotal = books.reduce((sum, book) => sum + book.notesCount, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your profile</Text>
      <Text style={styles.subtitle}>Your reading circle at a glance.</Text>

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{booksInCirculation}</Text>
          <Text style={styles.statLabel}>Books in circulation</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{friends.length}</Text>
          <Text style={styles.statLabel}>Friends in circle</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{booksBeingRead}</Text>
          <Text style={styles.statLabel}>Being read now</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{booksInTransit}</Text>
          <Text style={styles.statLabel}>On the way</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{notesTotal}</Text>
          <Text style={styles.statLabel}>Reader notes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {Math.round((notesTotal / Math.max(booksInCirculation, 1)) * 10) / 10}
          </Text>
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
