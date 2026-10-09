import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Book, Friend, RootStackParamList } from '../types';
import { theme } from '../theme';
import { coverColorFor } from '../lib/covers';

type AddBookScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddBook'>;
  /** You add your own copies; nobody adds a book on someone else's behalf. */
  owner: Friend | null;
  onAddBook: (book: Book) => void;
};

export function AddBookScreen({ navigation, owner, onAddBook }: AddBookScreenProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');

  const missing = [!title.trim() && 'a title', !author.trim() && 'an author'].filter(Boolean);
  const ready = missing.length === 0 && Boolean(owner);

  const handleSubmit = () => {
    if (!ready || !owner) {
      return;
    }

    const bookId = `book-${Date.now()}`;
    const newBook: Book = {
      id: bookId,
      title: title.trim(),
      author: author.trim(),
      coverColor: coverColorFor(title.trim(), author.trim()),
      // Only the owner starts in the queue. Everyone else signs up from the
      // book's page if they want it; nobody is put in line for them.
      queue: [{ ...owner, position: 0, status: 'reading' }],
      // Opening the journey log is what puts the book in someone's hands:
      // current location is derived from this entry.
      handoffs: [
        {
          id: `handoff-${Date.now()}`,
          bookId,
          fromFriend: null,
          toFriend: owner.id,
          happenedAt: new Date().toISOString(),
        },
      ],
    };

    onAddBook(newBook);
    // Land on the new book, where people can start signing up. Replacing the
    // form means Back goes home rather than to an emptied form.
    navigation.replace('BookDetail', { bookId, bookTitle: newBook.title });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.subtitle}>
        Start a new traveling copy. Friends sign up for it from its page.
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="The Secret Life of Bees"
          placeholderTextColor={theme.colors.faint}
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>Author</Text>
        <TextInput
          value={author}
          onChangeText={setAuthor}
          placeholder="Sue Monk Kidd"
          placeholderTextColor={theme.colors.faint}
          style={styles.input}
        />

        {owner && (
          <Text style={styles.hint}>
            Your copy, starting with you in {owner.city}. It comes back to you once
            everyone who signs up has read it.
          </Text>
        )}

        <Pressable
          style={[styles.primaryButton, !ready && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={!ready}
        >
          <Text style={styles.primaryButtonText}>Add book</Text>
        </Pressable>
        {!ready && missing.length > 0 && (
          <Text style={styles.missing}>Add {missing.join(' and ')} to continue.</Text>
        )}
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
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 21,
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
  hint: {
    marginTop: 8,
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 18,
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
  missing: {
    marginTop: 8,
    textAlign: 'center',
    color: theme.colors.muted,
    fontSize: 12,
  },
});
