import { StyleSheet, Text, View } from 'react-native';
import { mockBooks } from '../data/mockData';
import { theme } from '../theme';

type BookDetailScreenProps = {
  route: { params: { bookId: string; bookTitle: string } };
};

export function BookDetailScreen({ route }: BookDetailScreenProps) {
  const { bookId } = route.params;
  const book = mockBooks.find((item) => item.id === bookId);

  if (!book) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Book not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.cover, { backgroundColor: book.coverColor }]}>
        <Text style={styles.coverText}>{book.title}</Text>
      </View>

      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>{book.author}</Text>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Current owner</Text>
        <Text style={styles.value}>{book.currentOwner}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Next stop</Text>
        <Text style={styles.value}>{book.nextStop}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Tracking</Text>
        <Text style={styles.value}>{book.trackingNumber}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Notes</Text>
        <Text style={styles.value}>{book.notesCount}</Text>
      </View>

      <View style={styles.timelineBox}>
        <Text style={styles.timelineTitle}>Journey</Text>
        {book.friends.map((person) => (
          <View key={person.id} style={styles.timelineItem}>
            <Text style={styles.timelineDot} />
            <View>
              <Text style={styles.timelineName}>{person.name}</Text>
              <Text style={styles.timelineLocation}>{person.city}, {person.state}</Text>
            </View>
            <Text style={styles.timelineStatus}>{person.status}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
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
    marginBottom: 12,
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
    backgroundColor: '#c38e63',
    marginRight: 12,
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
  },
});
