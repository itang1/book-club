import { Image, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  /** In the sample club: tagged so it's never mistaken for a real loan. */
  isSample?: boolean;
  /** Shown as a labelled pill when the card isn't already under its group's heading. */
  groupName?: string;
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

export function BookCard({ book, currentUserId, isSample, groupName, onPress }: BookCardProps) {
  const withMe = currentUserId !== null && holderId(book) === currentUserId;

  return (
    <Pressable style={styles.card} onPress={() => onPress?.(book)}>
      {book.coverUrl ? (
        <Image
          source={{ uri: book.coverUrl }}
          style={[styles.cover, styles.coverImage, { backgroundColor: book.coverColor }]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.cover, { backgroundColor: book.coverColor }]}>
          <Text style={styles.coverText} numberOfLines={4}>
            {book.title}
          </Text>
        </View>
      )}

      <View style={styles.details}>
        {groupName ? (
          <View style={styles.groupPill}>
            <Ionicons name="people" size={11} color={theme.colors.accent} />
            <Text style={styles.groupPillText} numberOfLines={1}>
              {groupName}
            </Text>
          </View>
        ) : null}
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>

        <Text style={[styles.line, withMe && styles.lineMine]}>{whereLine(book, currentUserId)}</Text>
        <Text style={styles.lineQuiet}>{nextLine(book, currentUserId)}</Text>

        <View style={styles.footer}>
          <View style={styles.tags}>
            <Text style={styles.status}>{statusLabel(book)}</Text>
            {isSample && <Text style={styles.sample}>Sample</Text>}
          </View>
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
  // A real cover fills the same slot; the colour shows while it loads.
  coverImage: {
    padding: 0,
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
  groupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.soft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
    maxWidth: '100%',
  },
  groupPillText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  tags: {
    flexDirection: 'row',
  },
  sample: {
    marginLeft: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.muted,
    overflow: 'hidden',
  },
  updated: {
    fontSize: 11,
    color: theme.colors.muted,
  },
});
