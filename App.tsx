import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Annotation } from '../types';
import { theme } from '../theme';

type NotesScreenProps = {
  books: Array<{ id: string; title: string; annotations: Annotation[] }>;
};

export function NotesScreen({ books }: NotesScreenProps) {
  const notes = books.flatMap((book) =>
    book.annotations.map((annotation) => ({
      ...annotation,
      bookTitle: book.title,
    })),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notes & highlights</Text>
      <Text style={styles.subtitle}>Every thoughtful mark left on the journey.</Text>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View key={item.id} style={styles.noteCard}>
            <Text style={styles.noteBook}>{item.bookTitle}</Text>
            <Text style={styles.noteMeta}>
              {item.friendName} • page {item.pageNumber ?? '—'} • {item.createdAt}
            </Text>
            <Text style={styles.noteText}>{item.note}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    marginTop: 6,
    marginBottom: 18,
  },
  list: {
    paddingBottom: 28,
  },
  noteCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 12,
  },
  noteBook: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  noteMeta: {
    color: theme.colors.muted,
    fontSize: 11,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  noteText: {
    color: theme.colors.text,
    lineHeight: 22,
    fontSize: 14,
  },
});
