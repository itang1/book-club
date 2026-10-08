import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Book } from '../types';
import { theme } from '../theme';

type BookDetailScreenProps = {
  route: { params: { bookId: string; bookTitle: string } };
  books: Book[];
};

export function BookDetailScreen({ route, books }: BookDetailScreenProps) {
  const { bookId } = route.params;
  const book = books.find((item) => item.id === bookId);

  if (!book) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Book not found.</Text>
      </View>
    );
  }

  const nameFor = (friendId: string) =>
    book.friends.find((person) => person.id === friendId)?.name ?? 'Unassigned';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.cover, { backgroundColor: book.coverColor }]}>
        <Text style={styles.coverText}>{book.title}</Text>
      </View>

      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>{book.author}</Text>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{book.status.replace('-', ' ')}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Current owner</Text>
        <Text style={styles.value}>{nameFor(book.currentOwner)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Next stop</Text>
        <Text style={styles.value}>{nameFor(book.nextStop)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Reader notes</Text>
        <Text style={styles.value}>{book.notesCount}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Last updated</Text>
        <Text style={styles.value}>{book.lastUpdated}</Text>
      </View>

      <View style={styles.timelineBox}>
        <Text style={styles.timelineTitle}>Reading path</Text>
        <Text style={styles.timelineCaption}>
          The order this copy travels through the circle.
        </Text>
        {book.friends.map((person) => {
          const isCurrent = person.id === book.currentOwner;
          const isNext = person.id === book.nextStop;

          return (
            <View key={person.id} style={styles.timelineItem}>
              <View style={[styles.timelineDot, isCurrent && styles.timelineDotActive]} />
              <View style={styles.timelinePerson}>
                <Text style={styles.timelineName}>
                  {person.name}
                  {isCurrent ? ' · has it now' : isNext ? ' · up next' : ''}
                </Text>
                <Text style={styles.timelineLocation}>
                  {person.city}, {person.state}
                </Text>
              </View>
              <Text style={styles.timelineStatus}>{person.status}</Text>
            </View>
          );
        })}
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
  timelineBox: {
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    marginTop: 20,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  timelineCaption: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.border,
    marginRight: 12,
  },
  timelineDotActive: {
    backgroundColor: '#c38e63',
  },
  timelinePerson: {
    flexShrink: 1,
  },
  timelineName: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  timelineLocation: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  timelineStatus: {
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
});
