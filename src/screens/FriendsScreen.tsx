import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Book, Friend, Friendship } from '../types';
import { theme } from '../theme';
import { holderId, placeInLine } from '../lib/bookState';
import { friendIdsOf, suggestionsFor } from '../lib/friendGraph';
import { inviteLink } from '../lib/invite';

type FriendsScreenProps = {
  members: Friend[];
  friendships: Friendship[];
  books: Book[];
  currentUserId: string | null;
  onAddFriend: (personId: string) => void;
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

function Avatar({ name }: { name: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{name.charAt(0)}</Text>
    </View>
  );
}

/**
 * Opens the share sheet with an invite link. On web without the Share API
 * (most desktop browsers), the link is shown to copy instead.
 */
function InviteButton({ inviterId }: { inviterId: string }) {
  const [shownLink, setShownLink] = useState<string | null>(null);
  const link = inviteLink(inviterId);

  const invite = async () => {
    try {
      await Share.share({
        message: `Come pass books around with me on Sisterhood of the Traveling Books: ${link}`,
      });
    } catch {
      setShownLink(link);
    }
  };

  return (
    <View>
      <Pressable style={styles.primaryButton} onPress={invite}>
        <Text style={styles.primaryButtonText}>Invite a friend</Text>
      </Pressable>
      {shownLink && (
        <View style={styles.linkBox}>
          <Text style={styles.linkLabel}>Send them this link:</Text>
          <Text style={styles.linkText} selectable>
            {shownLink}
          </Text>
        </View>
      )}
    </View>
  );
}

export function FriendsScreen({
  members,
  friendships,
  books,
  currentUserId,
  onAddFriend,
}: FriendsScreenProps) {
  const insets = useSafeAreaInsets();
  const friendIds = friendIdsOf(friendships, currentUserId);
  const friends = members.filter((person) => friendIds.has(person.id));
  const suggestions = suggestionsFor(currentUserId, members, friendships, books);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
    >
      <Text style={styles.title}>Friends</Text>
      <Text style={styles.subtitle}>Who has what, and who's waiting.</Text>

      {friends.length === 0 ? (
        <Text style={styles.empty}>
          No friends yet. Add someone you know below, or invite them to join.
        </Text>
      ) : (
        friends.map((friend) => (
          <View key={friend.id} style={styles.friendCard}>
            <Avatar name={friend.name} />
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{friend.name}</Text>
              <Text style={styles.friendLocation}>
                {friend.city}, {friend.state}
              </Text>
              <Text style={styles.friendDetail}>{activityFor(friend, books)}</Text>
            </View>
          </View>
        ))
      )}

      {suggestions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>People you may know</Text>
          {suggestions.map(({ person, reason }) => (
            <View key={person.id} style={styles.suggestion}>
              <Avatar name={person.name} />
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{person.name}</Text>
                <Text style={styles.friendLocation}>{reason}</Text>
              </View>
              <Pressable style={styles.addButton} onPress={() => onAddFriend(person.id)}>
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      {currentUserId && (
        <>
          <Text style={styles.sectionTitle}>Someone new?</Text>
          <Text style={styles.sectionCaption}>
            They make their own profile, and you start out as friends.
          </Text>
          <InviteButton inviterId={currentUserId} />
        </>
      )}
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
    paddingBottom: 32,
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
  empty: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionCaption: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: -4,
    marginBottom: 12,
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
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
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
  addButton: {
    backgroundColor: theme.colors.soft,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 15,
  },
  linkBox: {
    marginTop: 10,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
  },
  linkLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 4,
  },
  linkText: {
    fontSize: 13,
    color: theme.colors.text,
  },
});
