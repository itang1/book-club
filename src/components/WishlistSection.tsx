import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Friend } from '../types';
import { theme } from '../theme';
import { useWishlist } from '../lib/wishlist';

type Props = {
  groupId: string;
  currentUserId: string | null;
  /** Whoever runs the group can take any wish down. */
  adminId?: string;
  members: Friend[];
};

/**
 * Books the group would read that nobody in it owns yet. Suggest one, or say
 * "I'd read that"; whoever finds a copy sees there's a line before lending.
 */
export function WishlistSection({ groupId, currentUserId, adminId, members }: Props) {
  const { wishes, error, add, toggleVote, remove } = useWishlist(groupId, currentUserId);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');

  const firstName = (id: string | null) =>
    id === currentUserId
      ? 'you'
      : (members.find((person) => person.id === id)?.name.split(' ')[0] ?? 'someone');

  const submit = () => {
    if (!title.trim()) {
      return;
    }
    add(title, author);
    setTitle('');
    setAuthor('');
  };

  return (
    <View>
      <Text style={styles.heading}>Wishlist</Text>
      <Text style={styles.caption}>
        Books nobody here owns yet. Say you'd read one, so whoever finds a copy knows there's a line
        waiting.
      </Text>
      <View style={styles.card}>
        {wishes.length === 0 ? (
          <Text style={styles.empty}>No wishes yet. What would you read next?</Text>
        ) : (
          wishes.map((wish, index) => {
            const mine = currentUserId !== null && wish.voters.includes(currentUserId);
            const count = wish.voters.length;
            const canRemove =
              currentUserId !== null &&
              (wish.suggestedBy === currentUserId || adminId === currentUserId);
            return (
              <View key={wish.id} style={[styles.row, index > 0 && styles.divider]}>
                <View style={styles.text}>
                  <Text style={styles.title}>{wish.title}</Text>
                  {wish.author ? <Text style={styles.author}>{wish.author}</Text> : null}
                  <Text style={styles.meta}>
                    Wished by {firstName(wish.suggestedBy)}
                    {count > 0 ? ` · ${count} would read it` : ''}
                  </Text>
                  {canRemove && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Take down ${wish.title}`}
                      onPress={() => remove(wish.id)}
                      hitSlop={6}
                    >
                      <Text style={styles.remove}>Take down</Text>
                    </Pressable>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: mine }}
                  accessibilityLabel={
                    mine
                      ? `You'd read ${wish.title}. Tap to take it back.`
                      : `I'd read ${wish.title}`
                  }
                  onPress={() => toggleVote(wish.id)}
                  style={[styles.vote, mine && styles.voted]}
                >
                  <Text style={[styles.voteText, mine && styles.votedText]}>
                    {mine ? "You'd read it" : "I'd read that"}
                  </Text>
                </Pressable>
              </View>
            );
          })
        )}

        <View style={[styles.add, wishes.length > 0 && styles.divider]}>
          <TextInput
            accessibilityLabel="Title of a book to wish for"
            value={title}
            onChangeText={setTitle}
            placeholder="A book you'd love to read"
            placeholderTextColor={theme.colors.faint}
            style={styles.input}
            maxLength={200}
          />
          <TextInput
            accessibilityLabel="Its author"
            value={author}
            onChangeText={setAuthor}
            placeholder="Author (optional)"
            placeholderTextColor={theme.colors.faint}
            style={styles.input}
            maxLength={200}
            onSubmitEditing={submit}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!title.trim()}
            onPress={submit}
            style={[styles.button, !title.trim() && styles.disabled]}
          >
            <Text style={styles.buttonText}>Add to the wishlist</Text>
          </Pressable>
          {error && <Text style={styles.error}>Couldn't save that: {error}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 22,
    marginBottom: 4,
  },
  caption: { color: theme.colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  empty: { color: theme.colors.muted, fontSize: 14, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.rule },
  text: { flex: 1 },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 16,
    fontStyle: 'italic',
    color: theme.colors.text,
  },
  author: { fontSize: 13, color: theme.colors.muted, marginTop: 1 },
  meta: { fontSize: 12, color: theme.colors.muted, marginTop: 4 },
  remove: { fontSize: 12, fontWeight: '700', color: theme.colors.accent, marginTop: 4 },
  vote: {
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  voted: { backgroundColor: theme.colors.accent },
  voteText: { fontSize: 13, fontWeight: '700', color: theme.colors.accent },
  votedText: { color: theme.colors.onAccent },
  add: { paddingVertical: 12, gap: 8 },
  input: {
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radius.md,
    padding: 10,
    color: theme.colors.text,
    fontSize: 15,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  disabled: { opacity: 0.4 },
  buttonText: { ...theme.caps, color: theme.colors.onAccent, fontWeight: '700', fontSize: 12 },
  error: { fontSize: 13, color: theme.colors.stamp },
});
