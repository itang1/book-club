import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Book, RootStackParamList } from '../types';
import { BookCard } from '../components/BookCard';
import { describeLeg, hasLetter, holderId, recentActivity, relativeTime } from '../lib/bookState';
import { theme } from '../theme';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  books: Book[];
  currentUserId: string | null;
};

export function HomeScreen({ navigation, books, currentUserId }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  // What's in your hands comes first: that's the one thing you can act on.
  const mine = books.filter((book) => currentUserId !== null && holderId(book) === currentUserId);
  const others = books.filter((book) => !mine.includes(book));
  const recent = recentActivity(books, 4);

  const open = (book: Book) =>
    navigation.navigate('BookDetail', { bookId: book.id, bookTitle: book.title });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
    >
      <View style={styles.headerWrap}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Sisterhood of the Traveling Books</Text>
          <Text style={styles.subtitle}>Track the books your friends pass around.</Text>
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate('AddBook')}
          accessibilityRole="button"
          accessibilityLabel="Add a book"
        >
          <Ionicons name="add" size={24} color={theme.colors.onAccent} />
        </Pressable>
      </View>

      {mine.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.sectionTitleMine]}>Your turn</Text>
          </View>
          {mine.map((book) => (
            <BookCard key={book.id} book={book} currentUserId={currentUserId} onPress={open} />
          ))}
        </>
      )}

      {/* Derived entirely from the handoff log; there's no separate feed. */}
      {recent.length > 0 && (
        <View style={styles.feed}>
          <Text style={styles.feedTitle}>Recently</Text>
          {recent.map(({ book, leg }) => (
            <Pressable key={leg.id} style={styles.feedRow} onPress={() => open(book)}>
              <View style={[styles.feedSwatch, { backgroundColor: book.coverColor }]} />
              <Text style={styles.feedText} numberOfLines={2}>
                {describeLeg(book, leg)}
                {hasLetter(leg) ? ' · left a letter' : ''}
              </Text>
              <Text style={styles.feedTime}>{relativeTime(leg.happenedAt)}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>In circulation</Text>
        <Text style={styles.sectionMeta}>
          {others.length} {others.length === 1 ? 'book' : 'books'}
        </Text>
      </View>

      {others.length === 0 ? (
        <Text style={styles.empty}>
          No other copies yet. Tap + to add one you're willing to lend.
        </Text>
      ) : (
        others.map((book) => (
          <BookCard key={book.id} book={book} currentUserId={currentUserId} onPress={open} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.muted,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sectionTitleMine: {
    color: theme.colors.stamp,
  },
  sectionMeta: {
    fontSize: 12,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  feed: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    marginBottom: 20,
  },
  feedTitle: {
    fontSize: 12,
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 8,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  feedSwatch: {
    width: 10,
    height: 14,
    borderRadius: 2,
    marginRight: 10,
  },
  feedText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.text,
  },
  feedTime: {
    fontSize: 11,
    color: theme.colors.muted,
    marginLeft: 8,
  },
  empty: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
