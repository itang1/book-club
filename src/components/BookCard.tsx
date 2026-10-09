import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Book } from '../types';
import { theme } from '../theme';
import {
  friendNameIn,
  holderId,
  isInTransit,
  lastActivityAt,
  nextInLineId,
  placeInLine,
  relativeTime,
  statusLabel,
} from '../lib/bookState';

type BookCardProps = {
  book: Book;
  currentUserId: string | null;
  onPress?: (book: Book) => void;
};

/**
 * Where the copy is and who's next, said as two short sentences rather than a
 * label/value table. Phrased from the reader's side when it involves them.
 */
function whereLine(book: Book, currentUserId: string | null): string {
  const holder = holderId(book);
  if (!holder) {
    return 'Not circulating yet';
  }
  if (isInTransit(book)) {
    return holder === currentUserId
      ? 'On its way to you'
      : `In the post to ${friendNameIn(book, holder).split(' ')[0]}`;
  }
  if (holder === currentUserId) {
    return 'With you';
  }

  const entry = book.queue.find((person) => person.id === holder);
  return entry ? `With ${entry.name} · ${entry.city}` : `With ${friendNameIn(book, holder)}`;
}

function nextLine(book: Book, currentUserId: string | null): string {
  const myPlace = placeInLine(book, currentUserId);
  if (myPlace === 1) {
    return "You're next";
  }
  if (myPlace !== null) {
    return `You're #${myPlace} in line`;
  }

  const nextId = nextInLineId(book);
  return nextId ? `${friendNameIn(book, nextId)} is next` : 'Nobody in line yet';
}

export function BookCard({ book, currentUserId, onPress }: BookCardProps) {
  const withMe = currentUserId !== null && holderId(book) === currentUserId;

  return (
    <Pressable style={styles.card} onPress={() => onPress?.(book)}>
      <View style={[styles.cover, { backgroundColor: book.coverColor }]}>
        <Text style={styles.coverText} numberOfLines={4}>
          {book.title}
        </Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>{book.author}</Text>

        <Text style={[styles.line, withMe && styles.lineMine]}>{whereLine(book, currentUserId)}</Text>
        <Text style={styles.lineQuiet}>{nextLine(book, currentUserId)}</Text>

        <View style={styles.footer}>
          <Text style={styles.status}>{statusLabel(book)}</Text>
          <Text style={styles.updated}>{relativeTime(lastActivityAt(book))}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cover: {
    width: 90,
    height: 120,
    borderRadius: 14,
    justifyContent: 'flex-end',
    padding: 10,
    marginRight: 12,
  },
  coverText: {
    color: theme.colors.coverInk,
    fontFamily: theme.fonts.serif,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  author: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 10,
  },
  line: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  lineMine: {
    color: theme.colors.stamp,
  },
  lineQuiet: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    backgroundColor: theme.colors.soft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.accent,
    overflow: 'hidden',
  },
  updated: {
    fontSize: 11,
    color: theme.colors.muted,
  },
});
