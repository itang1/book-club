import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Book, Friend } from '../types';
import { theme } from '../theme';
import { holderId, placeInLine } from '../lib/bookState';

type FriendsScreenProps = {
  friends: Friend[];
  books: Book[];
};

/**
 * A friend's reading state is derived per book, so someone can be reading one
 * copy while waiting on another. A single global status per person would be
 * wrong as soon as two books are in circulation.
 */
function activityFor(friend: Friend, books: Book[]) {
  const holding = books.filter((book) => holderId(book) === friend.id);
  const next = books.filter((book) => placeInLine(book, friend.id) === 1);
  const later = books.filter((book) => (placeInLine(book, friend.id) ?? 0) > 1);

  const lines: string[] = [];
  if (holding.length > 0) {
    lines.push(`Has ${holding.map((book) => book.title).join(', ')}`);
  }
  if (next.length > 0) {
    lines.push(`Next in line for ${next.map((book) => book.title).join(', ')}`);
  }
  if (later.length > 0) {
    lines.push(`Signed up for ${later.map((book) => book.title).join(', ')}`);
  }

  return lines.join(' · ') || 'No books in hand';
}

export function FriendsScreen({ friends, books }: FriendsScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friends</Text>
      <Text style={styles.subtitle}>Who is next in line for the book?</Text>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.friendCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{item.name}</Text>
              <Text style={styles.friendLocation}>
                {item.city}, {item.state}
              </Text>
              <Text style={styles.friendDetail}>{activityFor(item, books)}</Text>
            </View>
          </View>
        )}
      />
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
  list: {
    paddingBottom: 24,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e4d2c3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontWeight: '800',
    color: theme.colors.text,
  },
  friendInfo: {
    flex: 1,
    paddingRight: 8,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  friendLocation: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  friendDetail: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
});
