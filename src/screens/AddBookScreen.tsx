import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Book, Friend, Group, RootStackParamList } from '../types';
import { theme } from '../theme';
import { coverColorFor } from '../lib/covers';
import { Ionicons } from '@expo/vector-icons';

type AddBookScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddBook'>;
  /** You add your own copies; nobody adds a book on someone else's behalf. */
  owner: Friend | null;
  /** Everyone in the club, to suggest who a gift was from. */
  members: Friend[];
  /** Your groups: every book is lent within one. */
  groups: Group[];
  onAddBook: (book: Book) => void;
  /** Start a group from here, if you're not in one yet. Returns its id. */
  onCreateGroup: (name: string) => string | null;
};

export function AddBookScreen({
  navigation,
  owner,
  members,
  groups,
  onAddBook,
  onCreateGroup,
}: AddBookScreenProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  // Your only group is picked for you; with several, you choose.
  const [groupId, setGroupId] = useState<string | null>(groups.length === 1 ? groups[0].id : null);
  const [newGroupName, setNewGroupName] = useState('');
  const group = groups.find((candidate) => candidate.id === groupId);
  const [isGift, setIsGift] = useState(false);
  const [giftedBy, setGiftedBy] = useState('');
  // Quick picks for who it was from; anyone else can be typed in.
  const giverSuggestions = members
    .filter((person) => person.id !== owner?.id)
    .map((person) => person.name.split(' ')[0]);

  const missing = [
    !title.trim() && 'a title',
    !author.trim() && 'an author',
    !group && 'a group',
  ].filter(Boolean);
  const ready = missing.length === 0 && Boolean(owner);

  const handleSubmit = () => {
    if (!ready || !owner || !group) {
      return;
    }

    const bookId = `book-${Date.now()}`;
    const newBook: Book = {
      id: bookId,
      title: title.trim(),
      author: author.trim(),
      coverColor: coverColorFor(title.trim(), author.trim()),
      giftedBy: isGift && giftedBy.trim() ? giftedBy.trim() : undefined,
      groupId: group.id,
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
          // You have it already; nothing to wait for in the post.
          receivedAt: new Date().toISOString(),
          placeCity: owner.city,
          placeRegion: owner.state,
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
        Send a copy out into the world. Friends sign up for it, read it, write
        you a letter, and eventually it comes home a little more loved.
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

        {/* Who can borrow it is the group, said in so many words. */}
        <Text style={styles.fieldLabel}>Who can borrow it?</Text>
        {groups.length === 0 ? (
          <View>
            <Text style={styles.hint}>
              Books are lent within a group. Start one for the friends you'll pass this to.
            </Text>
            <TextInput
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Group name, e.g. Sunday Book Club"
              placeholderTextColor={theme.colors.faint}
              style={styles.input}
            />
            <Pressable
              style={[styles.groupChip, styles.groupChipOn, !newGroupName.trim() && styles.primaryButtonDisabled]}
              disabled={!newGroupName.trim()}
              onPress={() => {
                const id = onCreateGroup(newGroupName);
                if (id) {
                  setGroupId(id);
                  setNewGroupName('');
                }
              }}
            >
              <Text style={[styles.groupChipText, styles.groupChipTextOn]}>Start this group</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.giverRow}>
            {groups.map((candidate) => (
              <Pressable
                key={candidate.id}
                style={[styles.groupChip, groupId === candidate.id && styles.groupChipOn]}
                onPress={() => setGroupId(candidate.id)}
              >
                <Text style={[styles.groupChipText, groupId === candidate.id && styles.groupChipTextOn]}>
                  {candidate.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {group && (
          <Text style={styles.hint}>Shared with {group.name}: they can see it and join the line.</Text>
        )}

        {/* A gift stays yours to lend; the book page credits the giver. */}
        <Pressable
          style={styles.giftToggle}
          onPress={() => setIsGift((on) => !on)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isGift }}
        >
          <View style={[styles.checkbox, isGift && styles.checkboxOn]}>
            {isGift && <Ionicons name="checkmark" size={14} color={theme.colors.onAccent} />}
          </View>
          <Ionicons name="gift-outline" size={16} color={theme.colors.accent} />
          <Text style={styles.giftToggleText}>It was a gift</Text>
        </Pressable>
        {isGift && (
          <View>
            <TextInput
              value={giftedBy}
              onChangeText={setGiftedBy}
              placeholder="Who gave it to you?"
              placeholderTextColor={theme.colors.faint}
              style={styles.input}
            />
            <View style={styles.giverRow}>
              {giverSuggestions.map((name) => (
                <Pressable
                  key={name}
                  style={[styles.giverChip, giftedBy === name && styles.giverChipOn]}
                  onPress={() => setGiftedBy(name)}
                >
                  <Text style={[styles.giverChipText, giftedBy === name && styles.giverChipTextOn]}>
                    {name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

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
          <Text style={styles.primaryButtonText}>Start its journey</Text>
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
  groupChip: {
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  groupChipOn: {
    backgroundColor: theme.colors.accent,
  },
  groupChipText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  groupChipTextOn: {
    color: theme.colors.onAccent,
  },
  giftToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxOn: {
    backgroundColor: theme.colors.accent,
  },
  giftToggleText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  giverRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  giverChip: {
    backgroundColor: theme.colors.soft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  giverChipOn: {
    backgroundColor: theme.colors.accent,
  },
  giverChipText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  giverChipTextOn: {
    color: theme.colors.onAccent,
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
