import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Book, Group, Letter } from '../types';
import { theme } from '../theme';
import { JourneyRoute } from '../components/JourneyRoute';
import { bookLink } from '../lib/links';
import {
  canReadLetter,
  canReturnHome,
  copyOwnerId,
  daysInCirculation,
  formatDate,
  friendNameIn,
  hasLetter,
  heldForDays,
  holderId,
  isBackHome,
  isInTransit,
  journey,
  nextInLineId,
  placeInLine,
  placeOf,
  placesVisited,
  readersSoFar,
  senderId,
  timesRead,
} from '../lib/bookState';

type BookDetailScreenProps = {
  route: { params: { bookId: string; bookTitle?: string } };
  books: Book[];
  groups: Group[];
  currentUserId: string | null;
  onHandOff: (bookId: string, toFriend: string, letter: Letter) => void;
  onMarkReceived: (bookId: string) => void;
  onChangeCover: (bookId: string, mode: 'find' | 'clear') => void;
  onJoinLine: (bookId: string) => void;
  onLeaveLine: (bookId: string) => void;
};

export function BookDetailScreen({
  route,
  books,
  groups,
  currentUserId,
  onHandOff,
  onMarkReceived,
  onChangeCover,
  onJoinLine,
  onLeaveLine,
}: BookDetailScreenProps) {
  const { bookId } = route.params;
  // Who the pending handoff is going to; non-null while the confirm sheet is up.
  const [confirmingTo, setConfirmingTo] = useState<string | null>(null);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [note, setNote] = useState('');
  // Shown when the browser has no share sheet, to copy by hand.
  const [shownLink, setShownLink] = useState<string | null>(null);
  const book = books.find((item) => item.id === bookId);

  if (!book) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>This book is off the shelf for now.</Text>
      </View>
    );
  }

  const closeSheet = () => {
    setConfirmingTo(null);
    setRating(undefined);
    setNote('');
  };

  const first = (id: string | null) => friendNameIn(book, id).split(' ')[0];
  const holder = holderId(book);
  const owner = copyOwnerId(book);
  const nextId = nextInLineId(book);
  const sender = senderId(book);
  const inPost = isInTransit(book);
  const legs = journey(book).reverse();
  const group = groups.find((candidate) => candidate.id === book.groupId);
  const groupName = group?.name;
  const isSample = Boolean(group?.isSample);

  const comingToMe = inPost && currentUserId !== null && holder === currentUserId;
  const iSentIt = inPost && currentUserId !== null && sender === currentUserId;
  const iHoldIt = !inPost && currentUserId !== null && currentUserId === holder;
  const myPlace = placeInLine(book, currentUserId);
  const goingHome = confirmingTo !== null && confirmingTo === owner && confirmingTo !== nextId;

  /** One line saying where the copy is, from the reader's side when it's theirs. */
  const whereItIs = (() => {
    if (comingToMe) {
      return `On its way to you from ${first(sender)}`;
    }
    if (iSentIt) {
      return `In the post to ${first(holder)}`;
    }
    if (inPost) {
      return `In the post from ${first(sender)} to ${first(holder)}`;
    }
    if (iHoldIt) {
      return 'In your hands';
    }
    const latest = journey(book).slice(-1)[0];
    const place = latest ? placeOf(book, latest) : null;
    const where = place ? ` in ${place.city}` : '';
    return isBackHome(book) ? `Back home with ${first(holder)}${where}` : `With ${first(holder)}${where}`;
  })();

  /**
   * The one thing this reader can do with the copy right now: receive it,
   * pass it on (or send it home), or sign up and step back.
   */
  const renderAction = () => {
    if (isSample) {
      return (
        <Text style={styles.actionNote}>
          This is the sample club: a look at a group with some history. Start your own
          group, or ask a friend for an invite, to lend and borrow for real.
        </Text>
      );
    }

    if (comingToMe) {
      return (
        <View>
          <Pressable style={styles.primaryButton} onPress={() => onMarkReceived(book.id)}>
            <Text style={styles.primaryButtonText}>Got it</Text>
          </Pressable>
          <Text style={styles.actionNote}>Tap when it arrives, so {first(sender)} knows.</Text>
        </View>
      );
    }

    if (iSentIt) {
      return (
        <Text style={styles.actionNote}>
          It becomes {first(holder)}'s once they tap Got it.
        </Text>
      );
    }

    if (iHoldIt) {
      if (nextId) {
        return (
          <Pressable style={styles.primaryButton} onPress={() => setConfirmingTo(nextId)}>
            <Text style={styles.primaryButtonText}>Send to {first(nextId)}</Text>
          </Pressable>
        );
      }

      if (canReturnHome(book) && owner) {
        return (
          <Pressable style={styles.primaryButton} onPress={() => setConfirmingTo(owner)}>
            <Text style={styles.primaryButtonText}>Send home to {first(owner)}</Text>
          </Pressable>
        );
      }

      return (
        <Text style={styles.actionNote}>
          It's yours to enjoy until someone joins the line.
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
        <View
          style={[styles.cover, { backgroundColor: book.coverColor }, book.coverUrl && styles.coverWithImage]}
        >
          <View style={styles.coverSpine} />
          {book.coverUrl ? (
            <Image
              source={{ uri: book.coverUrl }}
              style={styles.coverImage}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ) : null}
          <View style={book.coverUrl ? styles.coverTextBeside : undefined}>
            <Text style={styles.coverTitle}>{book.title}</Text>
            <Text style={styles.coverAuthor}>{book.author}</Text>
            {book.giftedBy ? (
              <View style={styles.gift}>
                <Ionicons name="gift-outline" size={13} color={theme.colors.coverInk} />
                <Text style={styles.giftText}>A gift from {book.giftedBy}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {/* This copy's own address: for a message, or an NFC sticker. */}
        <Pressable
          style={styles.shareLink}
          onPress={async () => {
            const link = bookLink(book.id);
            try {
              await Share.share({ message: `${book.title}, on Sisterhood of the Traveling Books: ${link}` });
            } catch {
              setShownLink(link);
            }
          }}
          accessibilityRole="button"
        >
          <Ionicons name="link-outline" size={14} color={theme.colors.accent} />
          <Text style={styles.shareLinkText}>Share link</Text>
        </Pressable>
        {/* The owner can fetch a cover, or go back to the colour if it's wrong. */}
        {currentUserId !== null && currentUserId === owner && !isSample && (
          <Pressable
            style={styles.coverAction}
            onPress={() => onChangeCover(book.id, book.coverUrl ? 'clear' : 'find')}
          >
            <Text style={styles.coverActionText}>
              {book.coverUrl ? 'Wrong cover? Use the colour instead' : 'Find the cover'}
            </Text>
          </Pressable>
        )}
        {shownLink && (
          <Text style={styles.shownLink} selectable>
            {shownLink}
          </Text>
        )}

        {/* Whose it is, and the one circle it travels in. */}
        <Text style={styles.ownership}>
          {first(owner)}'s copy
          {isSample
            ? ' · in the sample club'
            : groupName
              ? ` · shared with ${groupName}`
              : ''}
        </Text>

        {/* Where it is and what you can do about it, together, before
            anything else. This is what people open the page for. */}
        <View style={styles.statusCard}>
          <Text style={[styles.whereItIs, (iHoldIt || comingToMe) && styles.whereItIsMine]}>
            {whereItIs}
          </Text>
          <View style={styles.action}>{renderAction()}</View>
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

        {/* The route doubles as the line: who's had it, who has it, who's
            waiting, and home. */}
        <View style={[styles.box, styles.routeBox]}>
          <Text style={styles.boxTitle}>The route</Text>
          <Text style={styles.boxCaption}>Where this copy has been, and who's waiting.</Text>
          <JourneyRoute book={book} />
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Travel history</Text>
          <Text style={styles.boxCaption}>Every leg of the journey, newest first.</Text>
          {legs.length === 0 ? (
            <Text style={styles.legMeta}>This copy's journey starts with its first handoff.</Text>
          ) : (
            legs.map((leg, index) => {
              // `legs` is newest-first, so the held duration comes from the
              // original chronological ordering.
              const held = heldForDays(journey(book), legs.length - 1 - index);
              const place = placeOf(book, leg);

              return (
                <View key={leg.id} style={styles.legItem}>
                  <Text style={styles.legRoute}>
                    {leg.fromFriend
                      ? `${friendNameIn(book, leg.fromFriend)} → ${friendNameIn(book, leg.toFriend)}`
                      : book.giftedBy
                        ? `A gift from ${book.giftedBy} to ${friendNameIn(book, leg.toFriend)}`
                        : `Entered circulation with ${friendNameIn(book, leg.toFriend)}`}
                  </Text>
                  <Text style={styles.legMeta}>
                    {formatDate(leg.happenedAt)}
                    {place ? ` · ${place.city}` : ''}
                    {leg.fromFriend && !leg.receivedAt
                      ? ' · in the post'
                      : held !== null
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
              Tap this once it's in the post. {first(confirmingTo)} taps Got it when it
              arrives. The leg goes into the travel history for good.
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
    <View style={styles.stars} accessibilityLabel={value ? `${value} of 5 stars` : 'Unrated'}>
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
  gift: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    opacity: 0.85,
  },
  giftText: {
    marginLeft: 6,
    fontFamily: theme.fonts.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: theme.colors.coverInk,
  },
  coverWithImage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  coverImage: {
    width: 96,
    height: 144,
    borderRadius: 4,
    marginRight: 16,
  },
  coverTextBeside: {
    flex: 1,
  },
  coverAction: {
    alignSelf: 'flex-end',
    marginTop: -10,
    marginBottom: 10,
  },
  coverActionText: {
    color: theme.colors.muted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  shareLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: -12,
    marginBottom: 14,
    paddingVertical: 4,
  },
  shareLinkText: {
    marginLeft: 4,
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  shownLink: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 12,
  },
  ownership: {
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  whereItIs: {
    fontFamily: theme.fonts.serif,
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  // The stamp red, kept for books that are yours right now.
  whereItIsMine: {
    color: theme.colors.stamp,
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
  // Stat values in the sans, per the figure spec; the serif stays on titles.
  statValue: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2,
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
