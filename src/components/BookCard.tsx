import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Book } from '../types';
import { theme } from '../theme';

type BookCardProps = {
  book: Book;
  onPress?: (book: Book) => void;
};

export function BookCard({ book, onPress }: BookCardProps) {
  const nameFor = (friendId: string) =>
    book.friends.find((person) => person.id === friendId)?.name ?? 'Unassigned';

  return (
    <Pressable style={styles.card} onPress={() => onPress?.(book)}>
      <View style={[styles.cover, { backgroundColor: book.coverColor }]}>
        <Text style={styles.coverText}>{book.title}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>{book.author}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Current owner</Text>
          <Text style={styles.metaValue}>{nameFor(book.currentOwner)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Next stop</Text>
          <Text style={styles.metaValue}>{nameFor(book.nextStop)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Notes</Text>
          <Text style={styles.metaValue}>{book.notesCount}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.status}>{book.status.replace('-', ' ')}</Text>
          <Text style={styles.updated}>{book.lastUpdated}</Text>
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
    shadowColor: '#000',
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
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: theme.colors.muted,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  metaValue: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
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
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  updated: {
    fontSize: 11,
    color: theme.colors.muted,
  },
});
