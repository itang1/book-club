import { StyleSheet, Text, View, Pressable } from 'react-native';
import { BookCover } from './BookCover';
import { Book } from '../types';
import { theme } from '../theme';
import {
  copyOwnerId,
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
  isSample?: boolean;
  /** Shown as a typed label when the card isn't already under its group's heading. */
  groupName?: string;
  onPress?: (book: Book) => void;
};

function whereLine(book: Book, currentUserId: string | null): string {
  const holder = holderId(book);
  if (!holder) {
    return 'Ready to travel';
  }
  if (isInTransit(book)) {
    return holder === currentUserId
      ? 'On its way to you'
      : `In the post to ${friendNameIn(book, holder)}`;
  }
  if (holder === currentUserId) {
    return 'In your hands';
  }

  const entry = book.queue.find((person) => person.id === holder);
  return entry ? `With ${entry.name} · ${entry.city}` : `With ${friendNameIn(book, holder)}`;
}

function nextLine(book: Book, currentUserId: string | null): string {
  const owner = copyOwnerId(book);
  if (book.calledHomeAt && owner && holderId(book) !== owner) {
    return owner === currentUserId
      ? "You've called it home"
      : `Called home by ${friendNameIn(book, owner)}`;
  }
  const myPlace = placeInLine(book, currentUserId);
  if (myPlace === 1) {
    return "You're next";
  }
  if (myPlace !== null) {
    return `You're #${myPlace} in line`;
  }

  const nextId = nextInLineId(book);
  return nextId ? `${friendNameIn(book, nextId)} is next` : 'Ready for its next reader';
}

export function BookCard({ book, currentUserId, isSample, groupName, onPress }: BookCardProps) {
  const withMe = currentUserId !== null && holderId(book) === currentUserId;
  const owner = copyOwnerId(book);
  const mine = currentUserId !== null && owner === currentUserId;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => onPress?.(book)}
    >
      <BookCover
        title={book.title}
        author={book.author}
        color={book.coverColor}
        imageUrl={book.coverUrl}
        width={78}
      />

      <View style={styles.details}>
        {groupName ? (
          <Text style={styles.group} numberOfLines={1}>
            {groupName}
          </Text>
        ) : null}
        <Text style={[styles.owner, mine && styles.ownerMine]} numberOfLines={1}>
          {mine ? 'Your copy' : `${friendNameIn(book, owner)}'s copy`}
        </Text>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>

        <Text style={[styles.line, withMe && styles.lineMine]}>
          {whereLine(book, currentUserId)}
        </Text>
        <Text style={styles.lineQuiet}>{nextLine(book, currentUserId)}</Text>

        <View style={styles.footer}>
          <Text style={[styles.stamp, withMe && styles.stampMine]}>{statusLabel(book)}</Text>
          {isSample && <Text style={styles.sample}>Sample</Text>}
          <Text style={styles.updated}>{relativeTime(lastActivityAt(book))}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.rule,
  },
  pressed: {
    backgroundColor: theme.colors.soft,
  },
  details: {
    flex: 1,
    marginLeft: 16,
  },
  group: {
    ...theme.caps,
    fontSize: 12,
    color: theme.colors.accent,
    marginBottom: 4,
  },
  owner: {
    ...theme.caps,
    fontSize: 11,
    letterSpacing: 1.2,
    color: theme.colors.faint,
    marginBottom: 3,
  },
  ownerMine: {
    color: theme.colors.stamp,
    fontWeight: '700',
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    color: theme.colors.text,
  },
  author: {
    fontFamily: theme.fonts.serif,
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 1,
    marginBottom: 10,
  },
  line: {
    fontSize: 14,
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
    alignItems: 'center',
  },
  stamp: {
    ...theme.caps,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.accent,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  stampMine: {
    color: theme.colors.stamp,
    borderColor: theme.colors.stamp,
  },
  sample: {
    marginLeft: 6,
    ...theme.caps,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.faint,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.faint,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  updated: {
    marginLeft: 'auto',
    ...theme.caps,
    fontSize: 12,
    color: theme.colors.faint,
  },
});
