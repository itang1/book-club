import { StyleSheet, Text, View } from 'react-native';

import { Book } from '../types';
import { theme } from '../theme';

type BookHeaderTitleProps = {
  bookId: string;
  fallbackTitle?: string;
  books: Book[];
};

/**
 * Title and author stacked as one unit in the nav header, so the two read
 * together instead of the title appearing in the header and the author
 * separately down the page.
 *
 * `fallbackTitle` covers the moment before the book list has loaded, using the
 * title already passed through navigation params.
 */
export function BookHeaderTitle({ bookId, fallbackTitle, books }: BookHeaderTitleProps) {
  const book = books.find((item) => item.id === bookId);
  const title = book?.title ?? fallbackTitle ?? 'Book';

  return (
    <View style={styles.wrap}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {book?.author ? (
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    // Leaves room for the back chevron on either side of a centred header.
    maxWidth: 240,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  author: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 1,
  },
});
