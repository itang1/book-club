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

type AddBookScreenProps = {
  friends: Friend[];
  onAddBook: (book: Book) => void;
  onAddFriend: (friend: Friend) => void;
};

const coverPalette = ['#d9a77d', '#b4b8a9', '#c7a6b5', '#c89366', '#93a7a5'];

export function AddBookScreen({ friends, onAddBook, onAddFriend }: AddBookScreenProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState<string>(friends[0]?.id ?? '');
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendCity, setNewFriendCity] = useState('');

  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId) ?? friends[0];

  const handleSubmit = () => {
    if (!title.trim() || !author.trim() || !selectedFriend) {
      return;
    }

    const newBook: Book = {
      id: `book-${Date.now()}`,
      title: title.trim(),
      author: author.trim(),
      coverColor: coverPalette[Math.floor(Math.random() * coverPalette.length)],
      status: 'in-transit',
      currentOwner: 'You',
      nextStop: `${selectedFriend.city}, ${selectedFriend.state}`,
      lastUpdated: 'Just now',
      notesCount: 0,
      trackingNumber: trackingNumber.trim() || 'Tracking pending',
      friends: [
        {
          id: selectedFriend.id,
          name: selectedFriend.name,
          city: selectedFriend.city,
          state: selectedFriend.state,
          status: 'waiting',
        },
      ],
    };

    onAddBook(newBook);
    setTitle('');
    setAuthor('');
    setTrackingNumber('');
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
      state: 'New',
      status: 'waiting',
      address: `${newFriendCity.trim()}`,
      email: `${newFriendName.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
    };

    onAddFriend(friend);
    setNewFriendName('');
    setNewFriendCity('');
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

        <Text style={styles.fieldLabel}>Tracking number</Text>
        <TextInput
          value={trackingNumber}
          onChangeText={setTrackingNumber}
          placeholder="9400 1234 5678 9012 3456 78"
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>Choose recipient</Text>
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
            Next reader: {selectedFriend.name} — {selectedFriend.city}, {selectedFriend.state}
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
