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

import { Book, Group, RootStackParamList } from '../types';
import { BookCard } from '../components/BookCard';
import { ClubYearCard } from '../components/ClubYearCard';
import { AboutSheet } from '../components/AboutSheet';
import { Letterhead } from '../components/Letterhead';
import { homage } from '../content/about';
import { holderId, isInTransit, relativeTime } from '../lib/bookState';
import { lately } from '../lib/lately';
import { theme } from '../theme';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  books: Book[];
  groups: Group[];
  currentUserId: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  /** Whether there's a Shelf tab to scan a bookshelf into (accounts only, not the demo). */
  canScanShelf?: boolean;
};

/** Rules & About is hidden for now: newcomers found it confusing. The sheet is kept. */
const SHOW_RULES_AND_ABOUT = false;

type FilterMode = 'all' | 'hands' | 'ready' | 'travelling';

export function HomeScreen({
  navigation,
  books,
  groups,
  currentUserId,
  refreshing,
  onRefresh,
  canScanShelf = false,
}: HomeScreenProps) {
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
  const others = activeBooks.filter((book) => !book.archivedAt);
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
  const ungrouped = others.filter(
    (book) => !sections.some((section) => section.books.includes(book)),
  );

  const recent = lately(
    books.filter((book) => !book.archivedAt),
    6,
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
      <View style={styles.headerWrap}>
        <Letterhead>
          <View style={styles.actions}>
            {canScanShelf ? (
              <>
                <Pressable
                  style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                  onPress={() => navigation.getParent()?.navigate('Shelf')}
                  accessibilityRole="button"
                >
                  <Ionicons name="camera-outline" size={16} color={theme.colors.accent} />
                  <Text style={styles.addButtonText}>Scan your bookshelf</Text>
                </Pressable>
                <Pressable
                  style={styles.aboutButton}
                  onPress={() => navigation.navigate('AddBook')}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text style={styles.aboutButtonText}>Lend one book</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                onPress={() => navigation.navigate('AddBook')}
                accessibilityRole="button"
              >
                <Text style={styles.addButtonText}>Lend a new book</Text>
              </Pressable>
            )}
            {SHOW_RULES_AND_ABOUT && (
              <Pressable
                style={styles.aboutButton}
                onPress={() => setAboutOpen(true)}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={styles.aboutButtonText}>Rules & About</Text>
              </Pressable>
            )}
          </View>
          {canScanShelf && (
            <Text style={styles.scanHint}>
              Take one photo of your shelves and we'll read every spine, so your friends can see
              what you have and ask to borrow it.
            </Text>
          )}
          <Text style={styles.homage}>{homage}</Text>
        </Letterhead>
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

      {!searchQuery && filterMode === 'all' && recent.length > 0 && (
        <View style={styles.lately}>
          <Text style={styles.latelyHeading}>Lately</Text>
          {recent.map((event) => (
            <Pressable
              key={event.id}
              style={({ pressed }) => [styles.latelyRow, pressed && styles.latelyPressed]}
              onPress={() =>
                navigation.navigate('BookDetail', { bookId: event.bookId, bookTitle: event.title })
              }
              accessibilityRole="button"
            >
              <Text style={styles.latelyText}>
                <Text style={styles.latelyWho}>{event.who}</Text>
                {event.verb === 'lent' ? ' put ' : event.verb === 'sent' ? ' sent ' : ' received '}
                <Text style={styles.latelyTitle}>{event.title}</Text>
                {event.verb === 'lent'
                  ? ' into circulation'
                  : event.verb === 'sent'
                    ? ` to ${event.to}`
                    : ''}
              </Text>
              <Text style={styles.latelyWhen}>{relativeTime(event.at)}</Text>
            </Pressable>
          ))}
        </View>
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

      {sections.length === 0 && ungrouped.length === 0 && (
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
            <View style={styles.groupHeaderText}>
              <Text style={styles.groupKicker}>{group.isSample ? 'Sample group' : 'Group'}</Text>
              <Text style={styles.sectionTitle}>{group.name}</Text>
              <Text style={styles.groupMeta}>
                {group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'} ·{' '}
                {groupBooks.length} {groupBooks.length === 1 ? 'book' : 'books'}
              </Text>
            </View>
            <Text style={styles.seeGroup}>See group →</Text>
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
          <Text style={styles.restedSubtitle}>Resting copies, kept safe after their journeys.</Text>
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
    alignItems: 'center',
    marginTop: 20,
  },

  aboutButton: {
    marginLeft: 22,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.brass,
    paddingBottom: 2,
  },

  aboutButtonText: {
    ...theme.caps,
    color: theme.colors.onMasthead,
    fontSize: 12,
  },

  headerWrap: {
    marginHorizontal: -20,
    marginBottom: 8,
  },

  homage: {
    fontFamily: theme.fonts.serif,
    fontStyle: 'italic',
    fontSize: 11,
    lineHeight: 15,
    color: theme.colors.onMasthead,
    opacity: 0.55,
    textAlign: 'center',
    marginTop: 20,
  },

  lately: {
    marginTop: 26,
  },
  latelyHeading: {
    ...theme.caps,
    fontSize: 12,
    letterSpacing: 2.4,
    color: theme.colors.text,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.text,
    paddingBottom: 8,
  },
  latelyRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.rule,
  },
  latelyPressed: {
    backgroundColor: theme.colors.soft,
  },
  latelyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.muted,
  },
  latelyWho: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  latelyTitle: {
    fontFamily: theme.fonts.serif,
    fontStyle: 'italic',
    color: theme.colors.text,
  },
  latelyWhen: {
    ...theme.caps,
    fontSize: 10,
    color: theme.colors.faint,
    marginLeft: 12,
  },

  scanHint: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.onMasthead,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 320,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.onMasthead,
    borderRadius: theme.radius.sm,
    paddingVertical: 11,
    paddingHorizontal: 18,
  },
  addButtonText: {
    ...theme.caps,
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 12,
  },

  sectionHeader: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.text,
    paddingBottom: 8,
    marginTop: 28,
  },

  sectionTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },

  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.text,
    paddingBottom: 8,
    marginTop: 28,
  },

  groupHeaderText: {
    flex: 1,
  },
  groupKicker: {
    ...theme.caps,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.muted,
    marginBottom: 2,
  },

  groupMeta: {
    ...theme.caps,
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 3,
  },

  seeGroup: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.accent,
    marginLeft: 8,
    marginBottom: 2,
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.rule,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 6,
  },

  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    paddingVertical: 2,
    outlineStyle: 'none',
  } as object,

  chipsScroll: {
    marginBottom: 8,
  },

  chipsContent: {
    flexDirection: 'row',
    gap: 20,
  },

  chip: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  chipActive: {
    borderBottomColor: theme.colors.accent,
  },

  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.muted,
  },

  chipTextActive: {
    color: theme.colors.text,
  },

  searchEmptyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
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
    borderRadius: theme.radius.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  clearSearchButtonText: {
    ...theme.caps,
    color: theme.colors.onAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  restedSection: {
    marginTop: 12,
  },

  restedSubtitle: {
    fontFamily: theme.fonts.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 8,
  },
});
