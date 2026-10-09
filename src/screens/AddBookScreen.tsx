import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Book, Friend } from '../types';
import { theme } from '../theme';
import { coverColorFor } from '../lib/covers';

type AddBookScreenProps = {
  friends: Friend[];
  onAddBook: (book: Book) => void;
  onAddFriend: (friend: Friend) => void;
};

export function AddBookScreen({ friends, onAddBook, onAddFriend }: AddBookScreenProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState<string>(friends[0]?.id ?? '');
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendCity, setNewFriendCity] = useState('');
  const [newFriendState, setNewFriendState] = useState('');

  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId) ?? friends[0];

  const handleSubmit = () => {
    if (!title.trim() || !author.trim() || !selectedFriend) {
      return;
    }

    // Start the reading queue at the chosen friend, then follow the rest of the group.
    const startIndex = friends.findIndex((friend) => friend.id === selectedFriend.id);
    const rotated = [...friends.slice(startIndex), ...friends.slice(0, startIndex)];
    const bookId = `book-${Date.now()}`;

    const newBook: Book = {
      id: bookId,
      title: title.trim(),
      author: author.trim(),
      coverColor: coverColorFor(title.trim(), author.trim()),
      status: 'reading',
      queue: rotated.map((friend, index) => ({
        ...friend,
        position: index,
        status: index === 0 ? 'reading' : 'waiting',
      })),
      // Opening the journey log is what puts the book in someone's hands:
      // current location is derived from this entry.
      handoffs: [
        {
          id: `handoff-${Date.now()}`,
          bookId,
          fromFriend: null,
          toFriend: selectedFriend.id,
          happenedAt: new Date().toISOString(),
        },
      ],
    };

    onAddBook(newBook);
    setTitle('');
    setAuthor('');
    setSelectedFriendId(friends[0]?.id ?? '');
  };

  const handleAddFriend = () => {
    if (!newFriendName.trim() || !newFriendCity.trim()) {
      return;
    }

    const friend: Friend = {
      id: `friend-${Date.now()}`,
      name: newFriendName.trim(),
      city: newFriendCity.trim(),
      state: newFriendState.trim().toUpperCase() || '—',
    };

    onAddFriend(friend);
    setNewFriendName('');
    setNewFriendCity('');
    setNewFriendState('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Add a book</Text>
      <Text style={styles.subtitle}>Start a new traveling copy.</Text>

      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="The Secret Life of Bees"
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>Author</Text>
        <TextInput
          value={author}
          onChangeText={setAuthor}
          placeholder="Sue Monk Kidd"
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>First reader</Text>
        <View style={styles.friendRow}>
          {friends.map((friend) => (
            <Pressable
              key={friend.id}
              onPress={() => setSelectedFriendId(friend.id)}
              style={[
                styles.friendChip,
                selectedFriendId === friend.id && styles.friendChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.friendChipText,
                  selectedFriendId === friend.id && styles.friendChipTextSelected,
                ]}
              >
                {friend.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {selectedFriend && (
          <Text style={styles.selectedFriend}>
            Starts with {selectedFriend.name} — {selectedFriend.city}, {selectedFriend.state}
          </Text>
        )}

        <Pressable style={styles.primaryButton} onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>Add book</Text>
        </Pressable>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.titleSecondary}>Add a friend</Text>
        <TextInput
          value={newFriendName}
          onChangeText={setNewFriendName}
          placeholder="Friend name"
          style={styles.input}
        />
        <TextInput
          value={newFriendCity}
          onChangeText={setNewFriendCity}
          placeholder="City"
          style={styles.input}
        />
        <TextInput
          value={newFriendState}
          onChangeText={setNewFriendState}
          placeholder="State (e.g. WA)"
          maxLength={2}
          autoCapitalize="characters"
          style={styles.input}
        />

        <Pressable style={styles.secondaryButton} onPress={handleAddFriend}>
          <Text style={styles.secondaryButtonText}>Add friend</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    color: theme.colors.text,
  },
  titleSecondary: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    marginBottom: 18,
  },
  formCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.soft,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  friendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    marginBottom: 8,
  },
  friendChip: {
    backgroundColor: theme.colors.soft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  friendChipSelected: {
    backgroundColor: theme.colors.accent,
  },
  friendChipText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  friendChipTextSelected: {
    color: '#fff',
  },
  selectedFriend: {
    marginTop: 8,
    color: theme.colors.muted,
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: '#efe5dd',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
});
