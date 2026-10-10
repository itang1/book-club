import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Book } from '../types';
import { theme } from '../theme';
import { yearInReview } from '../lib/stats';
import { PassportStamps } from './PassportStamps';

type YearInReviewSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Your real groups' books (the sample club would swamp the numbers). */
  books: Book[];
  currentUserId: string | null;
  year: number;
};

function listOf(names: string[]): string {
  return names.length <= 1
    ? names.join('')
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function BookLine({ book, detail }: { book: Book; detail: string }) {
  return (
    <View style={styles.bookLine}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={styles.bookCover} />
      ) : (
        <View style={[styles.bookCover, { backgroundColor: book.coverColor }]} />
      )}
      <View style={styles.bookText}>
        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.bookAuthor}>{book.author}</Text>
        <Text style={styles.bookDetail}>{detail}</Text>
      </View>
    </View>
  );
}

export function YearInReviewSheet({
  visible,
  onClose,
  books,
  currentUserId,
  year,
}: YearInReviewSheetProps) {
  const insets = useSafeAreaInsets();
  const review = yearInReview(books, year, currentUserId);
  const tiles = [
    { label: 'Handoffs', value: review.handoffs },
    { label: 'Letters', value: review.letters },
    { label: 'Readers', value: review.readers },
    { label: 'Places', value: review.places },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.topBarTitle}>{year} in books</Text>
          <Pressable style={styles.done} onPress={onClose} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.column}>
            <Text style={styles.title}>Your {year} in books</Text>
            <Text style={styles.subtitle}>
              {review.handoffs === 0
                ? 'A fresh year: lend a book and this page fills in.'
                : 'Everything your groups passed around this year, so far.'}
            </Text>

            <View style={styles.tiles}>
              {tiles.map((tile) => (
                <View key={tile.label} style={styles.tile}>
                  <Text style={styles.tileValue}>{tile.value}</Text>
                  <Text style={styles.tileLabel}>{tile.label}</Text>
                </View>
              ))}
            </View>

            {review.mostTravelled && (
              <>
                <Text style={styles.heading}>Furthest travelled</Text>
                <View style={styles.card}>
                  <BookLine
                    book={review.mostTravelled.book}
                    detail={`${review.mostTravelled.legs} ${
                      review.mostTravelled.legs === 1 ? 'leg' : 'legs'
                    } of its journey this year`}
                  />
                </View>
              </>
            )}

            {review.bestLoved && (
              <>
                <Text style={styles.heading}>Best loved</Text>
                <View style={styles.card}>
                  <BookLine
                    book={review.bestLoved.book}
                    detail={`${'★'.repeat(Math.round(review.bestLoved.average))} from ${
                      review.bestLoved.ratings
                    } ${review.bestLoved.ratings === 1 ? 'letter' : 'letters'}`}
                  />
                </View>
              </>
            )}

            {review.placeList.length > 0 && (
              <>
                <Text style={styles.heading}>Everywhere a book was read</Text>
                <View style={styles.card}>
                  <PassportStamps places={review.placeList} />
                </View>
              </>
            )}

            <Text style={styles.heading}>Your year</Text>
            <View style={styles.card}>
              <Text style={styles.mine}>
                {review.mine.finished === 0
                  ? 'Your first pass-on of the year is just ahead.'
                  : `You finished and passed on ${review.mine.finished} ${
                      review.mine.finished === 1 ? 'book' : 'books'
                    }, with ${review.mine.lettersWritten} ${
                      review.mine.lettersWritten === 1 ? 'letter' : 'letters'
                    } tucked inside${
                      review.mine.sentTo.length > 0
                        ? `, to ${listOf(review.mine.sentTo)}`
                        : ''
                    }.`}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  done: {
    position: 'absolute',
    right: 20,
    bottom: 12,
  },
  doneText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  column: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 24,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.muted,
    marginTop: 6,
    marginBottom: 16,
  },
  tiles: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingVertical: 16,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
  },
  tileValue: {
    fontSize: 26,
    fontWeight: '600',
    color: theme.colors.text,
  },
  tileLabel: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2,
  },
  heading: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 10,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 16,
  },
  bookLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookCover: {
    width: 48,
    height: 72,
    borderRadius: 4,
    marginRight: 14,
  },
  bookText: {
    flex: 1,
  },
  bookTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  bookAuthor: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
  bookDetail: {
    fontSize: 13,
    color: theme.colors.text,
    marginTop: 6,
  },
  mine: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
  },
});
