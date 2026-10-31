import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { Book, Friend, ShelfStackParamList } from '../types';
import { theme } from '../theme';
import { ShelfRow } from '../components/ShelfRow';
import type { ShelfState } from '../lib/shelf';

type PersonShelfScreenProps = NativeStackScreenProps<ShelfStackParamList, 'PersonShelf'> & {
  shelf: ShelfState;
  me: Friend | null;
  members: Friend[];
  books: Book[];
};

/** Someone else's shelf: browse it and ask to borrow. */
export function PersonShelfScreen({ route, shelf, me, members, books }: PersonShelfScreenProps) {
  const { personId } = route.params;
  const owner = members.find((person) => person.id === personId);
  const theirs = shelf.books.filter((book) => book.ownerId === personId);
  const [problem, setProblem] = useState<string | null>(null);
  const name = owner ? owner.name.split(' ')[0] : 'Their';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={shelf.loading} onRefresh={shelf.reload} />}
    >
      <Text style={styles.heading}>{owner ? `${name}'s shelf` : 'Shelf'}</Text>
      <Text style={styles.sub}>
        Ask to borrow and {name} gets an email. If it's a yes, it goes out to a group you share and
        you can join its line.
      </Text>
      {problem && <Text style={styles.problem}>{problem}</Text>}
      {theirs.length === 0 && <Text style={styles.sub}>Nothing on this shelf yet.</Text>}
      {theirs.map((book) => {
        const request = shelf.requests.find(
          (candidate) => candidate.shelfBookId === book.id && candidate.requesterId === me?.id,
        );
        const out = book.lentBookId
          ? books.find((candidate) => candidate.id === book.lentBookId && !candidate.archivedAt)
          : undefined;
        const status = out
          ? 'Out travelling. Join its line from the Books tab.'
          : request?.status === 'pending'
            ? 'You asked. Waiting to hear.'
            : request?.status === 'accepted'
              ? `${name} said yes. Watch for it in a group you share.`
              : request?.status === 'declined'
                ? `${name} isn't lending this one right now.`
                : undefined;
        const canAsk = !out && (!request || request.status === 'declined');
        return (
          <ShelfRow
            key={book.id}
            book={book}
            status={status}
            actions={
              canAsk
                ? [
                    {
                      label: 'Ask to borrow',
                      onPress: async () => setProblem(await shelf.requestBook(book.id)),
                    },
                  ]
                : undefined
            }
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  heading: {
    fontFamily: theme.fonts.serif,
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sub: { fontSize: 14, lineHeight: 20, color: theme.colors.muted, marginTop: 6, marginBottom: 16 },
  problem: { fontSize: 13, fontWeight: '600', color: theme.colors.text, marginBottom: 12 },
});
