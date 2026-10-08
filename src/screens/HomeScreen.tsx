import { StyleSheet, Text, View } from 'react-native';

import { Book } from './src/types';
import { BookCard } from './src/components/BookCard';
import { theme } from './src/theme';

type HomeScreenProps = {
  navigation: any;
  books: Book[];
};

export function HomeScreen({ navigation, books }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={styles.eyebrow}>Book Club</Text>
        <Text style={styles.title}>The traveling copy</Text>
        <Text style={styles.subtitle}>
          One book, many readers, and a shared reading journey.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>In transit</Text>
        <Text style={styles.sectionMeta}>{books.length} active books</Text>
      </View>

      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onPress={() => navigation.navigate('BookDetail', { bookId: book.id, bookTitle: book.title })}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
    paddingBottom: 32,
  },
  headerWrap: {
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#7a5c48',
    fontWeight: '700',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f1a17',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#54473f',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1a17',
  },
  sectionMeta: {
    fontSize: 12,
    color: '#7a5c48',
    fontWeight: '600',
  },
});
