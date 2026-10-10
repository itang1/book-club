import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Book, Friend, Group } from '../types';
import { theme } from '../theme';
import { InviteButton } from '../components/InviteButton';
import {
  describeLeg,
  formatDate,
  hasLetter,
  holderId,
  isInTransit,
  recentActivity,
  statusLabel,
} from '../lib/bookState';
import { groupTotals } from '../lib/stats';

type GroupScreenProps = {
  route: { params: { groupId: string } };
  groups: Group[];
  members: Friend[];
  books: Book[];
  currentUserId: string | null;
  onOpenBook: (bookId: string) => void;
  onLeave: (groupId: string) => void;
  onLeft: () => void;
};

export function GroupScreen({
  route,
  groups,
  members,
  books,
  currentUserId,
  onOpenBook,
  onLeave,
  onLeft,
}: GroupScreenProps) {
  const [confirmLeave, setConfirmLeave] = useState(false);
  const group = groups.find((candidate) => candidate.id === route.params.groupId);

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>This group's page opens to its members.</Text>
      </View>
    );
  }

  const groupBooks = books.filter((book) => book.groupId === group.id);
  const totals = groupTotals(groupBooks);
  const history = recentActivity(groupBooks, 200);
  const people = group.memberIds
    .map((id) => members.find((person) => person.id === id))
    .filter((person): person is Friend => Boolean(person))
    .sort((a, b) => Number(b.id === currentUserId) - Number(a.id === currentUserId));

  const tiles = [
    { label: 'Books', value: totals.books },
    { label: 'Handoffs', value: totals.handoffs },
    { label: 'Letters', value: totals.letters },
    { label: 'Places', value: totals.places },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.column}>
        <Text style={styles.title}>
          {group.name}
          {group.isSample ? <Text style={styles.sampleTag}>  Sample</Text> : null}
        </Text>
        <Text style={styles.subtitle}>
          {group.isSample
            ? "A sample club with some history, so you can see how a group comes together. It's for looking around: lending and lines happen in your own groups, and fellow visitors stay private."
            : "Members see each other's books and join their lines. It's all just for the group."}
        </Text>

        <View style={styles.tiles}>
          {tiles.map((tile) => (
            <View key={tile.label} style={styles.tile}>
              <Text style={styles.tileValue}>{tile.value}</Text>
              <Text style={styles.tileLabel}>{tile.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.heading}>Members</Text>
        <View style={styles.card}>
          <View style={styles.memberRow}>
            {people.map((person) => (
              <View key={person.id} style={styles.member}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{person.name.charAt(0)}</Text>
                </View>
                <Text style={styles.memberName} numberOfLines={1}>
                  {person.id === currentUserId ? 'You' : person.name.split(' ')[0]}
                </Text>
              </View>
            ))}
          </View>
          {!group.isSample && (
            <View style={styles.invite}>
              <InviteButton group={group} />
            </View>
          )}
        </View>

        <Text style={styles.heading}>Books</Text>
        {groupBooks.length === 0 ? (
          <Text style={styles.empty}>Lend the first book from Books and it shows up here.</Text>
        ) : (
          <View style={styles.card}>
            {groupBooks.map((book, index) => (
              <Pressable
                key={book.id}
                style={[styles.bookRow, index > 0 && styles.divider]}
                onPress={() => onOpenBook(book.id)}
              >
                {book.coverUrl ? (
                  <Image source={{ uri: book.coverUrl }} style={styles.bookCover} />
                ) : (
                  <View style={[styles.bookCover, { backgroundColor: book.coverColor }]} />
                )}
                <View style={styles.bookText}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.bookMeta}>
                    {statusLabel(book)}
                    {holderId(book) && !isInTransit(book)
                      ? ` · with ${
                          holderId(book) === currentUserId
                            ? 'you'
                            : (book.queue.find((entry) => entry.id === holderId(book))?.name.split(' ')[0] ??
                              'someone')
                        }`
                      : ''}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.heading}>History</Text>
        {history.length === 0 ? (
          <Text style={styles.empty}>The story starts with the first handoff.</Text>
        ) : (
          <View style={styles.card}>
            {history.map(({ book, leg }, index) => (
              <Pressable
                key={leg.id}
                style={[styles.historyRow, index > 0 && styles.divider]}
                onPress={() => onOpenBook(book.id)}
              >
                <View style={[styles.swatch, { backgroundColor: book.coverColor }]} />
                <View style={styles.historyText}>
                  <Text style={styles.historyLine}>
                    {describeLeg(book, leg)}
                    {hasLetter(leg) ? ' · left a letter' : ''}
                  </Text>
                  <Text style={styles.historyDate}>{formatDate(leg.happenedAt)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {!group.isSample &&
          (confirmLeave ? (
            <View style={styles.leaveConfirm}>
              <Text style={styles.note}>
                Leave {group.name}? You'll stop seeing its books, and come off any lines you're
                waiting in.
              </Text>
              <View style={styles.leaveButtons}>
                <Pressable
                  style={styles.dangerButton}
                  onPress={() => {
                    onLeave(group.id);
                    onLeft();
                  }}
                >
                  <Text style={styles.dangerButtonText}>Leave</Text>
                </Pressable>
                <Pressable style={styles.plainButton} onPress={() => setConfirmLeave(false)}>
                  <Text style={styles.plainButtonText}>Stay</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.leaveLink} onPress={() => setConfirmLeave(true)}>
              <Text style={styles.leaveText}>Leave group</Text>
            </Pressable>
          ))}
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
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    marginTop: 8,
  },
  sampleTag: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
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
    paddingVertical: 14,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
  },
  tileValue: {
    fontSize: 24,
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
    marginTop: 22,
    marginBottom: 10,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  memberRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  member: {
    width: 64,
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.fonts.serif,
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  memberName: {
    fontSize: 12,
    color: theme.colors.text,
    marginTop: 4,
  },
  invite: {
    paddingBottom: 12,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bookCover: {
    width: 36,
    height: 54,
    borderRadius: 3,
    marginRight: 12,
  },
  bookText: {
    flex: 1,
  },
  bookTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  bookMeta: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: theme.colors.muted,
    marginLeft: 8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  swatch: {
    width: 10,
    height: 14,
    borderRadius: 2,
    marginRight: 10,
    marginTop: 3,
  },
  historyText: {
    flex: 1,
  },
  historyLine: {
    fontSize: 14,
    lineHeight: 19,
    color: theme.colors.text,
  },
  historyDate: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  empty: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  note: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  leaveLink: {
    marginTop: 24,
    alignSelf: 'flex-start',
  },
  leaveText: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  leaveConfirm: {
    marginTop: 24,
  },
  leaveButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerButton: {
    borderWidth: 1.5,
    borderColor: theme.colors.text,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  dangerButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  plainButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  plainButtonText: {
    color: theme.colors.muted,
    fontWeight: '700',
    fontSize: 13,
  },
});
