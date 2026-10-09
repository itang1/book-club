import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Book, Friend } from '../types';
import { theme } from '../theme';
import { holderId, placeInLine } from '../lib/bookState';

type FriendsScreenProps = {
  friends: Friend[];
  books: Book[];
  onAddFriend: (friend: Friend) => void;
};

/**
 * A friend's reading state is derived per book, so someone can be reading one
 * copy while waiting on another. A single global status per person would be
 * wrong as soon as two books are in circulation.
 */
function activityFor(friend: Friend, books: Book[]) {
  const holding = books.filter((book) => holderId(book) === friend.id);
  const next = books.filter((book) => placeInLine(book, friend.id) === 1);
  const later = books.filter((book) => (placeInLine(book, friend.id) ?? 0) > 1);

  const lines: string[] = [];
  if (holding.length > 0) {
    lines.push(`Has ${holding.map((book) => book.title).join(', ')}`);
  }
  if (next.length > 0) {
    lines.push(`Next in line for ${next.map((book) => book.title).join(', ')}`);
  }
  if (later.length > 0) {
    lines.push(`Signed up for ${later.map((book) => book.title).join(', ')}`);
  }

  return lines.join(' · ') || 'No books in hand';
}

/** Collapsed until asked for: adding people is rare next to checking on them. */
function AddFriendForm({ onAddFriend }: { onAddFriend: (friend: Friend) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');

  const ready = Boolean(name.trim() && city.trim());

  if (!open) {
    return (
      <Pressable style={styles.secondaryButton} onPress={() => setOpen(true)}>
        <Text style={styles.secondaryButtonText}>+ Add a friend</Text>
      </Pressable>
    );
  }

  const handleAdd = () => {
    if (!ready) {
      return;
    }

    onAddFriend({
      id: `friend-${Date.now()}`,
      name: name.trim(),
      city: city.trim(),
      state: region.trim() || '—',
    });
    setName('');
    setCity('');
    setRegion('');
    setOpen(false);
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Add a friend</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Name"
        placeholderTextColor={theme.colors.faint}
        style={styles.input}
      />
      <TextInput
        value={city}
        onChangeText={setCity}
        placeholder="City"
        placeholderTextColor={theme.colors.faint}
        style={styles.input}
      />
      {/* Free text, not a two-letter code: the group isn't all in the US. */}
      <TextInput
        value={region}
        onChangeText={setRegion}
        placeholder="State or country (optional)"
        placeholderTextColor={theme.colors.faint}
        style={styles.input}
      />

      <Pressable
        style={[styles.primaryButton, !ready && styles.primaryButtonDisabled]}
        onPress={handleAdd}
        disabled={!ready}
      >
        <Text style={styles.primaryButtonText}>Add friend</Text>
      </Pressable>
      <Pressable style={styles.cancel} onPress={() => setOpen(false)}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

export function FriendsScreen({ friends, books, onAddFriend }: FriendsScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>Friends</Text>
      <Text style={styles.subtitle}>Who has what, and who's waiting.</Text>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={<AddFriendForm onAddFriend={onAddFriend} />}
        renderItem={({ item }) => (
          <View style={styles.friendCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{item.name}</Text>
              <Text style={styles.friendLocation}>
                {item.city}, {item.state}
              </Text>
              <Text style={styles.friendDetail}>{activityFor(item, books)}</Text>
            </View>
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
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 6,
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    marginBottom: 18,
  },
  list: {
    paddingBottom: 24,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: theme.fonts.serif,
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  friendInfo: {
    flex: 1,
    paddingRight: 8,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  friendLocation: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  friendDetail: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    marginTop: 4,
  },
  formTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: theme.colors.soft,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 4,
    backgroundColor: theme.colors.soft,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  cancel: {
    marginTop: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelText: {
    color: theme.colors.muted,
    fontWeight: '700',
    fontSize: 14,
  },
});
