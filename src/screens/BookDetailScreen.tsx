import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Book, Group, Letter } from '../types';
import { theme } from '../theme';
import { JourneyRoute } from '../components/JourneyRoute';
import { EditDetailsSheet, PassOnSheet, RetireSheet } from './book/BookSheets';
import { TravelHistory } from './book/TravelHistory';
import { styles } from './book/styles';
import { bookLink } from '../lib/links';
import { printBookplate } from '../lib/bookplate';
import {
  canReturnHome,
  copyOwnerId,
  daysInCirculation,
  friendNameIn,
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
  stayProgress,
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
  onUpdateBookDetails?: (bookId: string, title: string, author: string) => void;
  onRetireBook?: (bookId: string) => void;
  onUnretireBook?: (bookId: string) => void;
  onCallHome?: (bookId: string) => void;
  onCancelCallHome?: (bookId: string) => void;
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
  onUpdateBookDetails,
  onRetireBook,
  onUnretireBook,
  onCallHome,
  onCancelCallHome,
  onJoinLine,
  onLeaveLine,
}: BookDetailScreenProps) {
  const { bookId } = route.params;
  // Who the pending handoff is going to; non-null while the confirm sheet is up.
  const [confirmingTo, setConfirmingTo] = useState<string | null>(null);
  // Shown when the browser has no share sheet, to copy by hand.
  const [shownLink, setShownLink] = useState<string | null>(null);
  const [editingDetails, setEditingDetails] = useState(false);
  const [confirmingRetire, setConfirmingRetire] = useState(false);
  const book = books.find((item) => item.id === bookId);

  if (!book) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>This book is off the shelf for now.</Text>
      </View>
    );
  }

  // Full names everywhere, for consistency (the letter's "Dear …" keeps it friendly).
  const first = (id: string | null) => friendNameIn(book, id);
  const holder = holderId(book);
  const owner = copyOwnerId(book);
  const nextId = nextInLineId(book);
  const sender = senderId(book);
  const inPost = isInTransit(book);
  const group = groups.find((candidate) => candidate.id === book.groupId);
  const groupName = group?.name;
  const isSample = Boolean(group?.isSample);

  const comingToMe = inPost && currentUserId !== null && holder === currentUserId;
  const iSentIt = inPost && currentUserId !== null && sender === currentUserId;
  const iHoldIt = !inPost && currentUserId !== null && currentUserId === holder;
  const myPlace = placeInLine(book, currentUserId);
  const stay = stayProgress(book, group?.paceWeeks);
  const goingHome = confirmingTo !== null && confirmingTo === owner && confirmingTo !== nextId;

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
    return isBackHome(book)
      ? `Back home with ${first(holder)}${where}`
      : `With ${first(holder)}${where}`;
  })();

  const renderAction = () => {
    if (book.archivedAt) {
      return <Text style={styles.actionNote}>Resting on the home shelf after its travels.</Text>;
    }

    if (isSample) {
      return (
        <Text style={styles.actionNote}>
          This is a sample group: a look at a group in motion. Start your own group, or ask a friend
          for an invite, to lend and borrow for real.
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
        <Text style={styles.actionNote}>It becomes {first(holder)}'s once they tap Got it.</Text>
      );
    }

    if (iHoldIt && book.calledHomeAt && owner && owner !== currentUserId) {
      return (
        <View>
          <Pressable style={styles.primaryButton} onPress={() => setConfirmingTo(owner)}>
            <Text style={styles.primaryButtonText}>Send home to {first(owner)}</Text>
          </Pressable>
          <Text style={styles.actionNote}>
            {first(owner)} has called this copy home. Send it back when you finish; the line waits
            for it to travel again.
          </Text>
        </View>
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
        <Text style={styles.actionNote}>It's yours to enjoy until someone joins the line.</Text>
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
        <View
          style={[
            styles.cover,
            { backgroundColor: book.coverColor },
            book.coverUrl && styles.coverWithImage,
          ]}
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
        <Pressable
          style={styles.shareLink}
          onPress={async () => {
            const link = bookLink(book.id);
            try {
              await Share.share({ message: `${book.title}, on The Traveling Books: ${link}` });
            } catch {
              setShownLink(link);
            }
          }}
          accessibilityRole="button"
        >
          <Ionicons name="link-outline" size={14} color={theme.colors.accent} />
          <Text style={styles.shareLinkText}>Share link</Text>
        </Pressable>
        {currentUserId !== null && currentUserId === owner && !isSample && (
          <View style={styles.ownerActions}>
            <Pressable
              style={styles.ownerAction}
              onPress={() => onChangeCover(book.id, book.coverUrl ? 'clear' : 'find')}
              accessibilityRole="button"
            >
              <Text style={styles.ownerActionText}>
                {book.coverUrl ? 'Use colour swatch' : 'Find cover image'}
              </Text>
            </Pressable>
            {onUpdateBookDetails && (
              <Pressable
                style={styles.ownerAction}
                onPress={() => {
                  setEditingDetails(true);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.ownerActionText}>Edit title & author</Text>
              </Pressable>
            )}
            {Platform.OS === 'web' && (
              <Pressable
                style={styles.ownerAction}
                onPress={() =>
                  printBookplate({
                    title: book.title,
                    author: book.author,
                    owner: friendNameIn(book, owner),
                    link: bookLink(book.id),
                  })
                }
                accessibilityRole="button"
                accessibilityHint="Opens a page to print a bookplate with a QR code to this book"
              >
                <Text style={styles.ownerActionText}>Print a bookplate</Text>
              </Pressable>
            )}
            {!book.archivedAt && iHoldIt && onRetireBook && (
              <Pressable
                style={styles.ownerAction}
                onPress={() => setConfirmingRetire(true)}
                accessibilityRole="button"
              >
                <Text style={styles.ownerActionText}>Rest this copy</Text>
              </Pressable>
            )}
            {!book.archivedAt &&
              !isSample &&
              owner === currentUserId &&
              holder !== currentUserId && (
                <Pressable
                  style={styles.ownerAction}
                  onPress={() =>
                    book.calledHomeAt ? onCancelCallHome?.(book.id) : onCallHome?.(book.id)
                  }
                  accessibilityRole="button"
                >
                  <Text style={styles.ownerActionText}>
                    {book.calledHomeAt ? 'Let it keep travelling' : 'Call it home'}
                  </Text>
                </Pressable>
              )}
            {book.archivedAt && onUnretireBook && (
              <Pressable
                style={styles.ownerAction}
                onPress={() => onUnretireBook(book.id)}
                accessibilityRole="button"
              >
                <Text style={styles.ownerActionText}>Send it travelling again</Text>
              </Pressable>
            )}
          </View>
        )}
        {shownLink && (
          <Text style={styles.shownLink} selectable>
            {shownLink}
          </Text>
        )}

        {book.calledHomeAt && !book.archivedAt && holder !== owner && (
          <Text style={styles.calledHome}>
            {owner === currentUserId
              ? `You've called it home. ${first(holder)} sends it back to you next.`
              : `${first(owner)} has called it home. It goes back to them next.`}
          </Text>
        )}
        <Text style={styles.ownership}>
          {first(owner)}'s copy
          {isSample ? ' · in a sample group' : groupName ? ` · shared with ${groupName}` : ''}
        </Text>

        <View style={styles.statusCard}>
          <Text style={[styles.whereItIs, (iHoldIt || comingToMe) && styles.whereItIsMine]}>
            {whereItIs}
          </Text>
          {stay && (
            <View style={styles.pace} accessibilityRole="progressbar">
              <View style={styles.paceTrack}>
                <View
                  style={[
                    styles.paceFill,
                    { width: `${Math.min(100, (stay.days / (stay.ofWeeks * 7)) * 100)}%` },
                    stay.over && styles.paceFillOver,
                  ]}
                />
              </View>
              <Text style={styles.paceText}>
                {iHoldIt
                  ? `Week ${stay.week} of about ${stay.ofWeeks}, the group's pace.`
                  : `${first(holder)} is in week ${stay.week} of about ${stay.ofWeeks}.`}
                {iHoldIt && stay.over && nextId
                  ? ` ${first(nextId)} is next whenever you're ready.`
                  : ''}
              </Text>
            </View>
          )}
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

        <View style={[styles.box, styles.routeBox]}>
          <Text style={styles.boxTitle}>The route</Text>
          <Text style={styles.boxCaption}>Where this copy has been, and who's waiting.</Text>
          <JourneyRoute book={book} />
        </View>

        <TravelHistory book={book} currentUserId={currentUserId} />
      </ScrollView>
      {/* A handoff is append-only, so an accidental tap cannot be undone. */}
      <PassOnSheet
        book={book}
        to={confirmingTo}
        goingHome={goingHome}
        onConfirm={(to, letter) => onHandOff(book.id, to, letter)}
        onClose={() => setConfirmingTo(null)}
      />
      {editingDetails && (
        <EditDetailsSheet
          book={book}
          visible
          onSave={(title, author) => onUpdateBookDetails?.(book.id, title, author)}
          onClose={() => setEditingDetails(false)}
        />
      )}
      <RetireSheet
        visible={confirmingRetire}
        onConfirm={() => onRetireBook?.(book.id)}
        onClose={() => setConfirmingRetire(false)}
      />
    </>
  );
}
