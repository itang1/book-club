import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Book, Friend } from '../types';
import { theme } from '../theme';
import {
  holderId,
  journey,
  lastActivityAt,
  nextInLineId,
  relativeTime,
} from '../lib/bookState';

type ProfileScreenProps = {
  books: Book[];
  friends: Friend[];
  currentUserId: string | null;
  onChangeUser: (friendId: string) => void;
};

export function ProfileScreen({
  books,
  friends,
  currentUserId,
  onChangeUser,
}: ProfileScreenProps) {
  const me = friends.find((friend) => friend.id === currentUserId) ?? null;

  // There is no auth yet, so "who am I" is a local choice. Every stat below is
  // scoped to that person rather than the whole group.
  const withMe = me ? books.filter((book) => holderId(book) === me.id) : [];
  const comingToMe = me ? books.filter((book) => nextInLineId(book) === me.id) : [];
  const finished = me
    ? books.filter((book) =>
        book.queue.some((entry) => entry.id === me.id && entry.status === 'done'),
      )
    : [];
  const handoffsMade = me
    ? books.reduce(
        (sum, book) =>
          sum + journey(book).filter((leg) => leg.fromFriend === me.id).length,
        0,
      )
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your profile</Text>
      <Text style={styles.subtitle}>
        {me ? `Reading as ${me.name} — ${me.city}, ${me.state}` : 'Pick who you are in the group.'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>I am</Text>
        <View style={styles.chipRow}>
          {friends.map((friend) => {
            const selected = friend.id === currentUserId;

            return (
              <Pressable
                key={friend.id}
                onPress={() => onChangeUser(friend.id)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {friend.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.cardNote}>
          Stands in for sign-in. Resets when the app restarts.
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{withMe.length}</Text>
          <Text style={styles.statLabel}>With you now</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{comingToMe.length}</Text>
          <Text style={styles.statLabel}>Coming to you</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{finished.length}</Text>
          <Text style={styles.statLabel}>Books finished</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{handoffsMade}</Text>
          <Text style={styles.statLabel}>Handoffs made</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>In your hands</Text>
        {withMe.length === 0 ? (
          <Text style={styles.empty}>Nothing right now. Enjoy the quiet.</Text>
        ) : (
          withMe.map((book) => (
            <View key={book.id} style={styles.bookRow}>
              <View style={[styles.swatch, { backgroundColor: book.coverColor }]} />
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.bookMeta}>
                  Arrived {relativeTime(lastActivityAt(book))}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>On its way to you</Text>
        {comingToMe.length === 0 ? (
          <Text style={styles.empty}>No books queued for you yet.</Text>
        ) : (
          comingToMe.map((book) => (
            <View key={book.id} style={styles.bookRow}>
              <View style={[styles.swatch, { backgroundColor: book.coverColor }]} />
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.bookMeta}>
                  Currently with{' '}
                  {book.queue.find((entry) => entry.id === holderId(book))?.name ??
                    'someone in the group'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
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
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 12,
  },
  cardNote: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: theme.colors.soft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: theme.colors.accent,
  },
  chipText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  chipTextSelected: {
    color: '#fff',
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
  empty: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  swatch: {
    width: 34,
    height: 46,
    borderRadius: 6,
    marginRight: 12,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  bookMeta: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
});
