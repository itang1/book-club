import { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Book, Group, RootStackParamList } from '../types';
import { BookCard } from '../components/BookCard';
import { ClubYearCard } from '../components/ClubYearCard';
import { AboutSheet } from '../components/AboutSheet';
import { homage, tagline } from '../content/about';
import { holderId, isInTransit } from '../lib/bookState';
import { theme } from '../theme';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  books: Book[];
  groups: Group[];
  currentUserId: string | null;
  refreshing: boolean;
  onRefresh: () => void;
};

type FilterMode = 'all' | 'hands' | 'ready' | 'travelling';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const cleanQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = (book: Book) =>
    !cleanQuery ||
    book.title.toLowerCase().includes(cleanQuery) ||
    book.author.toLowerCase().includes(cleanQuery);

  const matchesFilter = (book: Book) => {
    if (filterMode === 'all') return true;
    const isMine = currentUserId !== null && holderId(book) === currentUserId;
    if (filterMode === 'hands') return isMine;
    const inPost = isInTransit(book);
    if (filterMode === 'ready') {
      return (
        !book.archivedAt &&
        (book.queue.length === 0 ||
          book.queue.every((q) => q.status === 'done' || q.status === 'reading'))
      );
    }
    if (filterMode === 'travelling') {
      return !book.archivedAt && (inPost || !isMine);
    }
    return true;
  };

  const activeBooks = books.filter(matchesSearch).filter(matchesFilter);
  const mine = activeBooks.filter(
    (book) => currentUserId !== null && holderId(book) === currentUserId && !book.archivedAt,
  );
  const sampleGroupIds = new Set(groups.filter((group) => group.isSample).map((group) => group.id));
  const isSampleBook = (book: Book) => Boolean(book.groupId && sampleGroupIds.has(book.groupId));
  const others = activeBooks.filter((book) => !mine.includes(book) && !book.archivedAt);
  const rested = activeBooks.filter((book) => Boolean(book.archivedAt));

  const sections = [...groups]
    .sort(
      (a, b) =>
        Number(Boolean(a.isSample)) - Number(Boolean(b.isSample)) || a.name.localeCompare(b.name),
    )
    .map((group) => ({ group, books: others.filter((book) => book.groupId === group.id) }))
    .filter((section) => section.books.length > 0);
  const myGroupNames = groups
    .filter((group) => !group.isSample && currentUserId && group.memberIds.includes(currentUserId))
    .map((group) => group.name)
    .sort();
  const groupName = (book: Book) => groups.find((group) => group.id === book.groupId)?.name;
  const ungrouped = others.filter(
    (book) => !sections.some((section) => section.books.includes(book)),
  );

  const open = (book: Book) =>
    navigation.navigate('BookDetail', { bookId: book.id, bookTitle: book.title });
  const openGroup = (groupId: string) =>
    navigation.getParent()?.navigate('Friends', { screen: 'Group', params: { groupId } });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      // Other people's handoffs only show up on a fetch, so pull to get them.
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.accent}
        />
      }
    >
      <View style={[styles.headerWrap, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Sisterhood of the Traveling Books</Text>
        <Text style={styles.subtitle}>{tagline}</Text>
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
        <Text style={styles.homage}>{homage}</Text>
      </View>

      {/* Search and filters */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={theme.colors.faint} style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by title or author…"
          placeholderTextColor={theme.colors.faint}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8} accessibilityRole="button">
            <Ionicons name="close-circle" size={16} color={theme.colors.faint} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {(['all', 'hands', 'ready', 'travelling'] as const).map((mode) => {
          const label = {
            all: 'All books',
            hands: 'In your hands',
            ready: 'Ready to read',
            travelling: 'Travelling',
          }[mode];
          const active = filterMode === mode;
          return (
            <Pressable
              key={mode}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilterMode(mode)}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Real groups only: the sample club would swamp the numbers. */}
      {myGroupNames.length > 0 && !searchQuery && filterMode === 'all' && (
        <ClubYearCard
          books={books.filter((book) => !isSampleBook(book))}
          groupNames={myGroupNames}
          currentUserId={currentUserId}
          slim={mine.length >= 3}
        />
      )}

      {books.length > 0 && activeBooks.length === 0 && (
        <View style={styles.searchEmptyCard}>
          <Text style={styles.searchEmptyTitle}>Looking for another story?</Text>
          <Text style={styles.searchEmptyText}>
            Clear the search to explore the full shelf, or lend a new copy to your circle.
          </Text>
          <Pressable
            style={styles.clearSearchButton}
            onPress={() => {
              setSearchQuery('');
              setFilterMode('all');
            }}
            accessibilityRole="button"
          >
            <Text style={styles.clearSearchButtonText}>Show all books</Text>
          </Pressable>
        </View>
      )}

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
          Got a book you'd pass around? Lend it and its journey begins.
        </Text>
      )}

      {sections.map(({ group, books: groupBooks }) => (
        <View key={group.id}>
          <Pressable
            style={styles.groupHeader}
            onPress={() => openGroup(group.id)}
            accessibilityRole="button"
            accessibilityLabel={`${group.name} group`}
          >
            <View style={styles.groupIcon}>
              <Ionicons name="people" size={16} color={theme.colors.accent} />
            </View>
            <View style={styles.groupHeaderText}>
              <Text style={styles.groupKicker}>{group.isSample ? 'Sample group' : 'Group'}</Text>
              <Text style={styles.sectionTitle}>{group.name}</Text>
              <Text style={styles.groupMeta}>
                {group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'} ·{' '}
                {groupBooks.length} {groupBooks.length === 1 ? 'book' : 'books'}
              </Text>
            </View>
            <Text style={styles.seeGroup}>See group ›</Text>
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

      {rested.length > 0 && (
        <View style={styles.restedSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Home shelf</Text>
          </View>
          <Text style={styles.restedSubtitle}>
            Resting copies, kept safe after their journeys.
          </Text>
          {rested.map((book) => (
            <BookCard key={book.id} book={book} currentUserId={currentUserId} onPress={open} />
          ))}
        </View>
      )}

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
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    marginRight: -10,
  },
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
    backgroundColor: theme.colors.masthead,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginBottom: 24,
  },
  homage: {
    fontSize: 11,
    lineHeight: 15,
    color: theme.colors.muted,
    marginTop: 6,
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
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 18,
    marginTop: 10,
    marginBottom: 14,
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupHeaderText: {
    flex: 1,
  },
  groupKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.muted,
    marginBottom: 1,
  },
  groupMeta: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  seeGroup: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.accent,
    marginLeft: 8,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 16,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    paddingVertical: 2,
  },
  chipsScroll: {
    marginBottom: 14,
  },
  chipsContent: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.soft,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  chipTextActive: {
    color: theme.colors.onAccent,
  },
  searchEmptyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    marginVertical: 12,
  },
  searchEmptyTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  searchEmptyText: {
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  clearSearchButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  clearSearchButtonText: {
    color: theme.colors.onAccent,
    fontSize: 13,
    fontWeight: '700',
  },
  restedSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
  },
  restedSubtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 12,
  },
});
