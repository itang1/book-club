import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Book } from '../types';
import { theme } from '../theme';
import {
  citiesVisited,
  currentOwnerId,
  daysInCirculation,
  formatDate,
  friendNameIn,
  heldForDays,
  journey,
  lastActivityAt,
  nextStopId,
  readingQueue,
  relativeTime,
} from '../lib/bookState';

type BookDetailScreenProps = {
  route: { params: { bookId: string; bookTitle: string } };
  books: Book[];
  onPassOn: (bookId: string) => void;
};

export function BookDetailScreen({ route, books, onPassOn }: BookDetailScreenProps) {
  const { bookId } = route.params;
  const book = books.find((item) => item.id === bookId);

  if (!book) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Book not found.</Text>
      </View>
    );
  }

  const ownerId = currentOwnerId(book);
  const nextId = nextStopId(book);
  const legs = journey(book).reverse();
  const queue = readingQueue(book);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.cover, { backgroundColor: book.coverColor }]}>
        <Text style={styles.coverText}>{book.title}</Text>
      </View>

      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>{book.author}</Text>

      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{journey(book).length}</Text>
          <Text style={styles.statLabel}>stops</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{citiesVisited(book)}</Text>
          <Text style={styles.statLabel}>cities</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{daysInCirculation(book)}</Text>
          <Text style={styles.statLabel}>days out</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{book.status.replace('-', ' ')}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Current owner</Text>
        <Text style={styles.value}>{friendNameIn(book, ownerId)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Next stop</Text>
        <Text style={styles.value}>
          {nextId ? friendNameIn(book, nextId) : 'End of the line'}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Last activity</Text>
        <Text style={styles.value}>{relativeTime(lastActivityAt(book))}</Text>
      </View>

      {nextId && (
        <Pressable style={styles.passButton} onPress={() => onPassOn(book.id)}>
          <Text style={styles.passButtonText}>
            Pass on to {friendNameIn(book, nextId)}
          </Text>
        </Pressable>
      )}

      <View style={styles.box}>
        <Text style={styles.boxTitle}>Reading path</Text>
        <Text style={styles.boxCaption}>The order this copy travels the group.</Text>
        {queue.map((person) => {
          const isCurrent = person.id === ownerId;
          const isNext = person.id === nextId;

          return (
            <View key={person.id} style={styles.pathItem}>
              <View style={[styles.dot, isCurrent && styles.dotActive]} />
              <View style={styles.pathPerson}>
                <Text style={styles.pathName}>
                  {person.name}
                  {isCurrent ? ' · has it now' : isNext ? ' · up next' : ''}
                </Text>
                <Text style={styles.pathLocation}>
                  {person.city}, {person.state}
                </Text>
              </View>
              <Text style={styles.pill}>{person.status}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>Travel history</Text>
        <Text style={styles.boxCaption}>Every leg of the journey, newest first.</Text>
        {legs.length === 0 ? (
          <Text style={styles.pathLocation}>This copy has not started travelling yet.</Text>
        ) : (
          legs.map((leg, index) => {
            // `legs` is newest-first, so the held duration comes from the
            // original chronological ordering.
            const held = heldForDays(journey(book), legs.length - 1 - index);

            return (
              <View key={leg.id} style={styles.legItem}>
                <Text style={styles.legRoute}>
                  {leg.fromFriend
                    ? `${friendNameIn(book, leg.fromFriend)} → ${friendNameIn(book, leg.toFriend)}`
                    : `Entered circulation with ${friendNameIn(book, leg.toFriend)}`}
                </Text>
                <Text style={styles.legMeta}>
                  {formatDate(leg.happenedAt)}
                  {held === null
                    ? ' · still reading'
                    : ` · held ${held} ${held === 1 ? 'day' : 'days'}`}
                </Text>
              </View>
            );
          })
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
  cover: {
    width: '100%',
    height: 180,
    borderRadius: 24,
    justifyContent: 'flex-end',
    padding: 18,
    marginBottom: 20,
  },
  coverText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
  },
  author: {
    fontSize: 16,
    color: theme.colors.muted,
    marginBottom: 18,
  },
  statRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    maxWidth: '60%',
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  passButton: {
    marginTop: 10,
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  passButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  box: {
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    marginTop: 20,
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  boxCaption: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  pathItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.border,
    marginRight: 12,
  },
  dotActive: {
    backgroundColor: '#c38e63',
  },
  pathPerson: {
    flexShrink: 1,
  },
  pathName: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  pathLocation: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  pill: {
    marginLeft: 'auto',
    textTransform: 'capitalize',
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: theme.colors.soft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  legItem: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  legRoute: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  legMeta: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
});
