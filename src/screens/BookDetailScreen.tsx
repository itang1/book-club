import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Book, Letter } from '../types';
import { theme } from '../theme';
import { JourneyRoute } from '../components/JourneyRoute';
import {
  canReadLetter,
  canReturnHome,
  copyOwnerId,
  daysInCirculation,
  formatDate,
  friendNameIn,
  hasFinished,
  hasLetter,
  heldForDays,
  holderId,
  isBackHome,
  journey,
  lastActivityAt,
  nextInLineId,
  placeInLine,
  placesVisited,
  readersSoFar,
  readingQueue,
  relativeTime,
  timesRead,
} from '../lib/bookState';

type BookDetailScreenProps = {
  route: { params: { bookId: string; bookTitle: string } };
  books: Book[];
  currentUserId: string | null;
  onHandOff: (bookId: string, toFriend: string, letter: Letter) => void;
  onJoinLine: (bookId: string) => void;
  onLeaveLine: (bookId: string) => void;
};

export function BookDetailScreen({
  route,
  books,
  currentUserId,
  onHandOff,
  onJoinLine,
  onLeaveLine,
}: BookDetailScreenProps) {
  const { bookId } = route.params;
  // Who the pending handoff is going to; non-null while the confirm sheet is up.
  const [confirmingTo, setConfirmingTo] = useState<string | null>(null);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [note, setNote] = useState('');
  const book = books.find((item) => item.id === bookId);

  if (!book) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Book not found.</Text>
      </View>
    );
  }

  const closeSheet = () => {
    setConfirmingTo(null);
    setRating(undefined);
    setNote('');
  };

  const holder = holderId(book);
  const owner = copyOwnerId(book);
  const nextId = nextInLineId(book);
  const legs = journey(book).reverse();
  const queue = readingQueue(book);

  const iHoldIt = currentUserId !== null && currentUserId === holder;
  const myPlace = placeInLine(book, currentUserId);
  const goingHome = confirmingTo !== null && confirmingTo === owner && confirmingTo !== nextId;

  /**
   * The one thing this reader can do with the copy right now. The holder
   * passes it on (or sends it home); everyone else signs up or steps back.
   */
  const renderAction = () => {
    if (iHoldIt) {
      if (nextId) {
        return (
          <Pressable style={styles.primaryButton} onPress={() => setConfirmingTo(nextId)}>
            <Text style={styles.primaryButtonText}>
              Pass on to {friendNameIn(book, nextId)}
            </Text>
          </Pressable>
        );
      }

      if (canReturnHome(book) && owner) {
        return (
          <Pressable style={styles.primaryButton} onPress={() => setConfirmingTo(owner)}>
            <Text style={styles.primaryButtonText}>
              Return to {friendNameIn(book, owner)}
            </Text>
          </Pressable>
        );
      }

      return (
        <Text style={styles.actionNote}>
          Nobody's waiting yet. It's yours to keep reading until someone asks.
        </Text>
      );
    }

    if (!currentUserId) {
      return null;
    }

    if (myPlace !== null) {
      return (
        <View>
          <Text style={styles.actionNote}>
            {myPlace === 1 ? "You're next in line." : `You're #${myPlace} in line.`}
          </Text>
          <Pressable style={styles.secondaryButton} onPress={() => onLeaveLine(book.id)}>
            <Text style={styles.secondaryButtonText}>Leave the line</Text>
          </Pressable>
        </View>
      );
    }

    const reads = timesRead(book, currentUserId);
    if (reads > 0) {
      return (
        <View>
          <Text style={styles.actionNote}>
            You've read this copy{reads > 1 ? ` ${reads} times` : ''}. Want it again?
          </Text>
          <Pressable style={styles.secondaryButton} onPress={() => onJoinLine(book.id)}>
            <Text style={styles.secondaryButtonText}>Join the line to reread</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <Pressable style={styles.primaryButton} onPress={() => onJoinLine(book.id)}>
        <Text style={styles.primaryButtonText}>Join the line</Text>
      </Pressable>
    );
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Stands in for cover art: a colour swatch derived from the title,
            carrying title and author the way a real jacket would. */}
        <View style={[styles.cover, { backgroundColor: book.coverColor }]}>
          <View style={styles.coverSpine} />
          <Text style={styles.coverTitle}>{book.title}</Text>
          <Text style={styles.coverAuthor}>{book.author}</Text>
        </View>

        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{readersSoFar(book)}</Text>
            <Text style={styles.statLabel}>readers so far</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{placesVisited(book)}</Text>
            <Text style={styles.statLabel}>places visited</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{daysInCirculation(book)}</Text>
            <Text style={styles.statLabel}>days travelling</Text>
          </View>
        </View>

        <View style={[styles.box, styles.routeBox]}>
          <Text style={styles.boxTitle}>The route</Text>
          <Text style={styles.boxCaption}>Where this copy has been, and where it's headed.</Text>
          <JourneyRoute book={book} />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>With</Text>
          <Text style={styles.value}>{friendNameIn(book, holder)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Belongs to</Text>
          <Text style={styles.value}>{friendNameIn(book, owner)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Next in line</Text>
          <Text style={styles.value}>
            {nextId ? friendNameIn(book, nextId) : 'Nobody yet'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Last activity</Text>
          <Text style={styles.value}>{relativeTime(lastActivityAt(book))}</Text>
        </View>

        {iHoldIt && (
          <Text style={styles.inHands}>In your hands</Text>
        )}
        <View style={styles.action}>{renderAction()}</View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>The line</Text>
          <Text style={styles.boxCaption}>Everyone who signed up, in the order they asked.</Text>
          {queue.map((person) => {
            const isCurrent = person.id === holder;
            const isNext = person.id === nextId;

            return (
              <View key={person.id} style={styles.pathItem}>
                <View style={[styles.dot, isCurrent && styles.dotActive]} />
                <View style={styles.pathPerson}>
                  <Text style={styles.pathName}>
                    {person.name}
                    {isCurrent ? ' · has it now' : isNext ? ' · up next' : ''}
                    {person.id === owner ? ' · owner' : ''}
                  </Text>
                  <Text style={styles.pathLocation}>
                    {person.city}, {person.state}
                  </Text>
                </View>
                {/* The holder is reading, whatever their row says: the log
                    decides where the book is, and a stale status shouldn't
                    contradict it. */}
                <Text style={styles.pill}>
                  {isCurrent
                    ? 'reading'
                    : person.status === 'waiting' && hasFinished(book, person.id)
                      ? 'rereading'
                      : person.status}
                </Text>
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
                    {held !== null
                      ? ` · held ${held} ${held === 1 ? 'day' : 'days'}`
                      : isBackHome(book)
                        ? ' · back home'
                        : ' · still reading'}
                  </Text>
                  {leg.fromFriend && hasLetter(leg) && (
                    canReadLetter(book, leg, currentUserId) ? (
                      <View style={styles.letter}>
                        {leg.rating ? <Stars value={leg.rating} size={13} /> : null}
                        {leg.note ? <Text style={styles.letterText}>“{leg.note}”</Text> : null}
                        <Text style={styles.letterSign}>— {friendNameIn(book, leg.fromFriend)}</Text>
                      </View>
                    ) : (
                      <View style={[styles.letter, styles.letterSealed]}>
                        <Text style={styles.letterSealedText}>
                          ✉ Sealed letter from {friendNameIn(book, leg.fromFriend)}. It opens
                          once you've finished the book.
                        </Text>
                      </View>
                    )
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
      {/* A handoff is append-only, so an accidental tap cannot be undone.
          A custom modal rather than Alert.alert, which react-native-web
          does not implement reliably. */}
      <Modal
        visible={confirmingTo !== null}
        transparent
        animationType="fade"
        onRequestClose={closeSheet}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              {goingHome ? 'Send it home?' : 'Send it on its way?'}
            </Text>
            <Text style={styles.sheetBody}>
              {book.title} moves from {friendNameIn(book, holder)} to{' '}
              {friendNameIn(book, confirmingTo)}. This adds a leg to the travel history
              and cannot be undone.
            </Text>

            {/* The letter. Readers who come after see it only once they've
                finished the book too. */}
            <Text style={styles.sheetLabel}>Leave a letter in the book</Text>
            <Stars value={rating} size={28} onChange={setRating} />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={`Dear ${friendNameIn(book, confirmingTo).split(' ')[0]}, …`}
              placeholderTextColor={theme.colors.faint}
              multiline
              maxLength={500}
              style={styles.sheetInput}
            />

            <Pressable
              style={styles.sheetConfirm}
              onPress={() => {
                if (confirmingTo) {
                  onHandOff(book.id, confirmingTo, { note, rating });
                }
                closeSheet();
              }}
            >
              <Text style={styles.sheetConfirmText}>
                Yes, {goingHome ? 'return' : 'pass'} to {friendNameIn(book, confirmingTo)}
              </Text>
            </Pressable>

            <Pressable style={styles.sheetCancel} onPress={closeSheet}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

/** Whole stars, 1–5. Read-only unless `onChange` is given; tap a star again to clear. */
function Stars({
  value,
  size,
  onChange,
}: {
  value?: number;
  size: number;
  onChange?: (value: number | undefined) => void;
}) {
  return (
    <View style={styles.stars} accessibilityLabel={value ? `${value} of 5 stars` : 'No rating'}>
      {[1, 2, 3, 4, 5].map((star) => {
        const icon = (
          <Ionicons
            name={value !== undefined && star <= value ? 'star' : 'star-outline'}
            size={size}
            color={theme.colors.accent}
          />
        );

        return onChange ? (
          <Pressable
            key={star}
            onPress={() => onChange(star === value ? undefined : star)}
            hitSlop={4}
            style={styles.starButton}
            accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
          >
            {icon}
          </Pressable>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stars: {
    flexDirection: 'row',
  },
  starButton: {
    marginRight: 6,
  },
  routeBox: {
    marginTop: 0,
    marginBottom: 18,
  },
  letter: {
    marginTop: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    padding: 10,
  },
  letterText: {
    fontFamily: theme.fonts.serif,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
    marginTop: 4,
  },
  letterSign: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 4,
  },
  letterSealed: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  letterSealedText: {
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 17,
  },
  sheetLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  sheetInput: {
    backgroundColor: theme.colors.soft,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    marginBottom: 16,
    minHeight: 72,
    color: theme.colors.text,
    fontSize: 14,
    textAlignVertical: 'top',
  },
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
    minHeight: 190,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    paddingVertical: 22,
    paddingRight: 22,
    paddingLeft: 32,
    marginBottom: 20,
  },
  coverSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  coverTitle: {
    color: theme.colors.coverInk,
    fontFamily: theme.fonts.serif,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
  },
  coverAuthor: {
    color: theme.colors.coverInk,
    opacity: 0.8,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
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
    fontFamily: theme.fonts.serif,
    fontSize: 22,
    fontWeight: '700',
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
  inHands: {
    alignSelf: 'center',
    marginTop: 6,
    color: theme.colors.stamp,
    backgroundColor: theme.colors.stampSoft,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  action: {
    marginTop: 10,
  },
  actionNote: {
    color: theme.colors.muted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 6,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 8,
    backgroundColor: theme.colors.soft,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 26, 23, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 22,
  },
  sheetTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 21,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  sheetBody: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.muted,
    marginBottom: 20,
  },
  sheetConfirm: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  sheetConfirmText: {
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 15,
  },
  sheetCancel: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    color: theme.colors.muted,
    fontWeight: '700',
    fontSize: 14,
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
    fontFamily: theme.fonts.serif,
    fontSize: 19,
    fontWeight: '700',
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
    backgroundColor: theme.colors.accent,
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
