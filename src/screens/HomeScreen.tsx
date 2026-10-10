import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Book, Group, RootStackParamList } from '../types';
import { BookCard } from '../components/BookCard';
import { ClubYearCard } from '../components/ClubYearCard';
import { AboutSheet } from '../components/AboutSheet';
import { tagline } from '../content/about';
import { holderId } from '../lib/bookState';
import { theme } from '../theme';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  books: Book[];
  groups: Group[];
  currentUserId: string | null;
  refreshing: boolean;
  onRefresh: () => void;
};

export function HomeScreen({
  navigation,
  books,
  groups,
  currentUserId,
  refreshing,
  onRefresh,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [aboutOpen, setAboutOpen] = useState(false);
  // What's in your hands comes first: that's the one thing you can act on.
  const mine = books.filter((book) => currentUserId !== null && holderId(book) === currentUserId);
  // Sample-club books come after real ones, so your own groups lead.
  const sampleGroupIds = new Set(groups.filter((group) => group.isSample).map((group) => group.id));
  const isSampleBook = (book: Book) => Boolean(book.groupId && sampleGroupIds.has(book.groupId));
  // Then every other book, under the group it's lent within: your groups
  // first (alphabetically), the sample club last.
  const others = books.filter((book) => !mine.includes(book));
  const sections = [...groups]
    .sort(
      (a, b) =>
        Number(Boolean(a.isSample)) - Number(Boolean(b.isSample)) || a.name.localeCompare(b.name),
    )
    .map((group) => ({ group, books: others.filter((book) => book.groupId === group.id) }))
    .filter((section) => section.books.length > 0);
  const groupName = (book: Book) => groups.find((group) => group.id === book.groupId)?.name;
  // Visible without being in one of your groups (say, you're in line for it
  // but left its group): still listed, just not under a group.
  const ungrouped = others.filter(
    (book) => !sections.some((section) => section.books.includes(book)),
  );

  const open = (book: Book) =>
    navigation.navigate('BookDetail', { bookId: book.id, bookTitle: book.title });
  // A group's own page lives on the Friends & Groups tab.
  const openGroup = (groupId: string) =>
    navigation.getParent()?.navigate('Friends', { screen: 'Group', params: { groupId } });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      // Other people's handoffs only show up on a fetch, so pull to get them.
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.accent}
        />
      }
    >
      <View style={styles.headerWrap}>
        <Text style={styles.title}>Sisterhood of the Traveling Books</Text>
        <Text style={styles.subtitle}>{tagline}</Text>
        {/* Labelled rather than a bare +: an icon on its own didn't say what
            it would add until you tapped it. Rules & About sits beside it at
            the same size: the one standing way into the Rules and Irene's
            About, on the screen everyone lands on. */}
        <View style={styles.actions}>
          <Pressable
            style={styles.addButton}
            onPress={() => navigation.navigate('AddBook')}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={18} color={theme.colors.onAccent} />
            <Text style={styles.addButtonText}>Lend a new book</Text>
          </Pressable>
          <Pressable
            style={styles.aboutButton}
            onPress={() => setAboutOpen(true)}
            accessibilityRole="button"
          >
            <Ionicons name="book-outline" size={17} color={theme.colors.accent} />
            <Text style={styles.aboutButtonText}>Rules & About</Text>
          </Pressable>
        </View>
      </View>

      {mine.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.sectionTitleMine]}>In your hands</Text>
          </View>
          {mine.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              currentUserId={currentUserId}
              groupName={groupName(book)}
              onPress={open}
            />
          ))}
        </>
      )}

      {sections.length === 0 && mine.length === 0 && ungrouped.length === 0 && (
        <Text style={styles.empty}>
          Nothing travelling yet. Got a book you'd pass around? Lend it.
        </Text>
      )}

      {sections.map(({ group, books: groupBooks }) => (
        <View key={group.id}>
          <Pressable style={styles.sectionHeader} onPress={() => openGroup(group.id)}>
            <Text style={styles.sectionTitle}>
              {group.name}
              {group.isSample ? <Text style={styles.sampleTag}>  Sample</Text> : null}
            </Text>
            <Text style={styles.sectionMeta}>
              {groupBooks.length} {groupBooks.length === 1 ? 'book' : 'books'} ›
            </Text>
          </Pressable>
          {groupBooks.map((book) => (
            <BookCard key={book.id} book={book} currentUserId={currentUserId} onPress={open} />
          ))}
        </View>
      ))}

      {ungrouped.length > 0 && (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Other books</Text>
          </View>
          {ungrouped.map((book) => (
            <BookCard key={book.id} book={book} currentUserId={currentUserId} onPress={open} />
          ))}
        </View>
      )}

      {/* Real groups only: the sample club would swamp the numbers. */}
      <ClubYearCard
        books={books.filter((book) => !isSampleBook(book))}
        currentUserId={currentUserId}
      />
      <AboutSheet visible={aboutOpen} onClose={() => setAboutOpen(false)} />
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    // Space between the two buttons, and between rows if a narrow screen
    // wraps them.
    marginRight: -10,
  },
  // Same size as Lend a new book, outlined rather than filled so lending
  // stays the main action.
  aboutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.card,
    borderRadius: 999,
    paddingVertical: 9,
    paddingLeft: 14,
    paddingRight: 18,
    marginRight: 10,
    marginBottom: 10,
  },
  aboutButtonText: {
    marginLeft: 6,
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  headerWrap: {
    marginBottom: 24,
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
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 18,
    marginRight: 10,
    marginBottom: 10,
  },
  addButtonText: {
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 6,
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
  sampleTag: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  sectionMeta: {
    fontSize: 12,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  empty: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
