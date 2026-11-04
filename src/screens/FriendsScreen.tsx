import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Book, Friend, Friendship, Group } from '../types';
import { theme } from '../theme';
import {
  describeLeg,
  holderId,
  isInTransit,
  placeInLine,
  recentActivity,
  relativeTime,
} from '../lib/bookState';
import { InviteButton } from '../components/InviteButton';
import { PersonSafetySheet } from '../components/PersonSafetySheet';
import type { Blocks } from '../lib/blocks';
import {
  friendIdsOf,
  groupmateIdsOf,
  incomingRequests,
  outgoingRequests,
  suggestionsFor,
} from '../lib/friendGraph';

type FriendsScreenProps = {
  members: Friend[];
  friendships: Friendship[];
  groups: Group[];
  books: Book[];
  currentUserId: string | null;
  onRequestFriend: (personId: string) => void;
  onAcceptFriend: (personId: string) => void;
  onRemoveFriend: (personId: string) => void;
  onCreateGroup: (name: string) => void;
  onOpenGroup: (groupId: string) => void;
  blocks: Blocks;
};

/**
 * A friend's reading state is derived per book, so someone can be reading one
 * copy while waiting on another.
 */
function activityFor(friend: Friend, books: Book[]) {
  const holding = books.filter((book) => holderId(book) === friend.id && !isInTransit(book));
  const next = books.filter((book) => placeInLine(book, friend.id) === 1);
  const later = books.filter((book) => (placeInLine(book, friend.id) ?? 0) > 1);

  const lines: string[] = [];
  if (holding.length > 0) {
    lines.push(`Reading ${holding.map((book) => book.title).join(', ')}`);
  }
  if (next.length > 0) {
    lines.push(`Next in line for ${next.map((book) => book.title).join(', ')}`);
  }
  if (later.length > 0) {
    lines.push(`Signed up for ${later.map((book) => book.title).join(', ')}`);
  }

  return lines.join(' · ') || 'Between books';
}

function Avatar({ name }: { name: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{name.charAt(0)}</Text>
    </View>
  );
}

/** The open target sits under the content, not around it: a button inside a button breaks on web. */
function GroupCard({
  group,
  members,
  books,
  currentUserId,
  onOpen,
}: {
  group: Group;
  members: Friend[];
  books: Book[];
  currentUserId: string | null;
  onOpen: () => void;
}) {
  const groupBooks = books.filter((book) => book.groupId === group.id);
  const latest = recentActivity(groupBooks, 1)[0];
  const people = group.memberIds
    .map((id) => members.find((person) => person.id === id))
    .filter((person): person is Friend => Boolean(person))
    .sort((a, b) => Number(b.id === currentUserId) - Number(a.id === currentUserId));
  const shown = people.slice(0, 5);

  return (
    <View style={styles.card}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${group.name} group`}
      />
      <View style={styles.groupHeader} pointerEvents="box-none">
        <View style={styles.groupTitle} pointerEvents="none">
          {group.isSample && <Text style={styles.sampleTag}>SAMPLE GROUP</Text>}
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.muted}>
            {group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'} ·{' '}
            {groupBooks.length} {groupBooks.length === 1 ? 'book' : 'books'}
          </Text>
        </View>
        {!group.isSample && <InviteButton group={group} compact />}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.muted}
          style={styles.chevron}
          pointerEvents="none"
        />
      </View>

      <View style={styles.faces} pointerEvents="none">
        {shown.map((person, index) => (
          <View key={person.id} style={[styles.face, index > 0 && styles.faceOverlap]}>
            <Text style={styles.faceText}>{person.name.charAt(0)}</Text>
          </View>
        ))}
        <Text style={styles.facesNames} numberOfLines={1}>
          {shown
            .map((person) => (person.id === currentUserId ? 'You' : person.name.split(' ')[0]))
            .join(', ')}
          {people.length > shown.length ? ` and ${people.length - shown.length} more` : ''}
        </Text>
      </View>

      <Text style={styles.latest} numberOfLines={2} pointerEvents="none">
        {latest
          ? `${describeLeg(latest.book, latest.leg)} · ${relativeTime(latest.leg.happenedAt)}`
          : 'Ready for its first book. Lend one to start.'}
      </Text>
    </View>
  );
}

function StartGroup({ onCreate }: { onCreate: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  if (!open) {
    return (
      <Pressable style={styles.secondaryButton} onPress={() => setOpen(true)}>
        <Text style={styles.secondaryButtonText}>+ Start a group</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <TextInput
        accessibilityLabel="Group name"
        value={name}
        onChangeText={setName}
        placeholder="Group name, e.g. Sunday Book Club"
        placeholderTextColor={theme.colors.faint}
        style={styles.input}
        autoFocus
      />
      <View style={styles.row}>
        <Pressable
          style={[styles.primarySmall, !name.trim() && styles.disabled]}
          disabled={!name.trim()}
          onPress={() => {
            onCreate(name);
            setName('');
            setOpen(false);
          }}
        >
          <Text style={styles.primarySmallText}>Start it</Text>
        </Pressable>
        <Pressable style={styles.plainButton} onPress={() => setOpen(false)}>
          <Text style={styles.plainButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function FriendsScreen({
  members,
  friendships,
  groups,
  books,
  currentUserId,
  onRequestFriend,
  onAcceptFriend,
  onRemoveFriend,
  onCreateGroup,
  onOpenGroup,
  blocks,
}: FriendsScreenProps) {
  const insets = useSafeAreaInsets();
  const [about, setAbout] = useState<Friend | null>(null);
  const blocked = new Set(blocks.blockedIds);
  const notBlocked = (candidate: Friend) => !blocked.has(candidate.id);

  const person = (id: string) => members.find((candidate) => candidate.id === id);
  const myGroups = groups
    .filter((group) => currentUserId && group.memberIds.includes(currentUserId))
    .sort(
      (a, b) =>
        Number(Boolean(a.isSample)) - Number(Boolean(b.isSample)) || a.name.localeCompare(b.name),
    );
  const hasRealGroup = myGroups.some((group) => !group.isSample);
  const friendIds = friendIdsOf(friendships, currentUserId);
  const friends = members.filter((candidate) => friendIds.has(candidate.id)).filter(notBlocked);
  const requests = incomingRequests(friendships, currentUserId)
    .map(person)
    .filter((candidate): candidate is Friend => Boolean(candidate))
    .filter(notBlocked);
  const asked = outgoingRequests(friendships, currentUserId);
  const askedPeople = members.filter((candidate) => asked.has(candidate.id)).filter(notBlocked);
  const suggestions = suggestionsFor(currentUserId, members, friendships, books, groups).filter(
    ({ person: candidate }) => notBlocked(candidate),
  );
  const blockedPeople = members.filter((candidate) => blocked.has(candidate.id));
  const groupmates = groupmateIdsOf(groups, currentUserId);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.headerWrap, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.eyebrow}>The Traveling Books</Text>
        <Text style={styles.title}>Friends and Groups</Text>
        <Text style={styles.subtitle}>
          Friends see what you're reading. To lend to each other, share a group.
        </Text>
      </View>

      {requests.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Requests</Text>
          {requests.map((requester) => (
            <View key={requester.id} style={styles.personRow}>
              <Avatar name={requester.name} />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{requester.name}</Text>
                <Text style={styles.muted}>wants to be friends</Text>
                <View style={styles.requestActions}>
                  <Pressable
                    style={styles.primarySmall}
                    onPress={() => onAcceptFriend(requester.id)}
                  >
                    <Text style={styles.primarySmallText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={styles.plainButton}
                    onPress={() => onRemoveFriend(requester.id)}
                  >
                    <Text style={styles.plainButtonText}>Not now</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAbout(requester)}
                    hitSlop={10}
                    accessibilityLabel={`More for ${requester.name}`}
                  >
                    <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.muted} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Your groups</Text>
      {!hasRealGroup && (
        <Text style={styles.empty}>
          Books are lent within groups. Start one for the friends you pass books to, or ask a friend
          for their group's invite link.
        </Text>
      )}
      {myGroups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          members={members}
          books={books}
          currentUserId={currentUserId}
          onOpen={() => onOpenGroup(group.id)}
        />
      ))}
      <StartGroup onCreate={onCreateGroup} />

      <Text style={styles.sectionTitle}>Friends</Text>
      {friends.length === 0 ? (
        <Text style={styles.empty}>Add someone from your groups below to get started.</Text>
      ) : (
        friends.map((friend) => (
          <View key={friend.id} style={styles.card}>
            <View style={styles.friendRow}>
              <Avatar name={friend.name} />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{friend.name}</Text>
                <Text style={styles.muted}>
                  {[friend.city, friend.state].filter((part) => part && part !== '—').join(', ')}
                </Text>
                <Text style={styles.activity}>{activityFor(friend, books)}</Text>
                {!groupmates.has(friend.id) && (
                  <Text style={styles.activity}>Share a group to lend each other books.</Text>
                )}
              </View>
              <Pressable
                onPress={() => setAbout(friend)}
                hitSlop={10}
                accessibilityLabel={`More for ${friend.name}`}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.muted} />
              </Pressable>
            </View>
          </View>
        ))
      )}

      {(suggestions.length > 0 || askedPeople.length > 0) && (
        <>
          <Text style={styles.sectionTitle}>People you may know</Text>
          {askedPeople.map((candidate) => (
            <View key={candidate.id} style={styles.personRow}>
              <Avatar name={candidate.name} />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{candidate.name}</Text>
                <Text style={styles.muted}>Waiting for them to accept</Text>
              </View>
              {/* Tapping Requested takes the request back. */}
              <Pressable style={styles.requested} onPress={() => onRemoveFriend(candidate.id)}>
                <Text style={styles.requestedText}>Requested</Text>
              </Pressable>
            </View>
          ))}
          {suggestions.map(({ person: candidate, reason }) => (
            <View key={candidate.id} style={styles.personRow}>
              <Avatar name={candidate.name} />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{candidate.name}</Text>
                <Text style={styles.muted}>{reason}</Text>
              </View>
              <Pressable style={styles.addButton} onPress={() => onRequestFriend(candidate.id)}>
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      {blockedPeople.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Blocked</Text>
          {blockedPeople.map((candidate) => (
            <View key={candidate.id} style={styles.personRow}>
              <Avatar name={candidate.name} />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{candidate.name}</Text>
                <Text style={styles.muted}>Can't ask you to be friends or borrow</Text>
              </View>
              <Pressable
                style={styles.plainButton}
                onPress={() => blocks.unblock(candidate.id)}
                accessibilityLabel={`Unblock ${candidate.name}`}
              >
                <Text style={styles.plainButtonText}>Unblock</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      <PersonSafetySheet
        person={about}
        blocks={blocks}
        onUnfriend={about && friendIds.has(about.id) ? () => onRemoveFriend(about.id) : undefined}
        onBlocked={onRemoveFriend}
        onClose={() => setAbout(null)}
      />
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
  eyebrow: {
    ...theme.caps,
    fontSize: 11,
    letterSpacing: 2.4,
    color: theme.colors.brass,
    marginBottom: 6,
  },
  headerWrap: {
    backgroundColor: theme.colors.letterhead,
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.brass,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 20,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    marginBottom: 6,
    color: theme.colors.onMasthead,
  },
  subtitle: {
    color: theme.colors.onMasthead,
    fontSize: 15,
    lineHeight: 21,
  },
  sectionTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  empty: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  muted: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  note: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chevron: {
    marginLeft: 8,
  },
  faces: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  face: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.avatar,
    borderWidth: 2,
    borderColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOverlap: {
    marginLeft: -8,
  },
  faceText: {
    fontFamily: theme.fonts.serif,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  facesNames: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: theme.colors.text,
  },
  latest: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupTitle: {
    flex: 1,
    marginLeft: 10,
  },
  groupName: {
    fontFamily: theme.fonts.serif,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sampleTag: {
    ...theme.caps,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
    marginBottom: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  personInfo: {
    flex: 1,
    paddingRight: 8,
  },
  personName: {
    fontFamily: theme.fonts.serif,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  activity: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  input: {
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radius.md,
    padding: 12,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    ...theme.caps,
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 12,
  },
  requested: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  requestedText: {
    color: theme.colors.muted,
    fontWeight: '700',
    fontSize: 13,
  },
  primarySmall: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  primarySmallText: {
    ...theme.caps,
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 12,
  },
  plainButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  plainButtonText: {
    ...theme.caps,
    color: theme.colors.muted,
    fontWeight: '700',
    fontSize: 12,
  },
  disabled: {
    opacity: 0.45,
  },
  secondaryButton: {
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...theme.caps,
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  dangerButtonText: {
    ...theme.caps,
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 26, 23, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.colors.card,
    // The house edge: every pop-up carries the letterhead green.
    borderTopWidth: 4,
    borderTopColor: theme.colors.letterhead,
    borderRadius: theme.radius.md,
    padding: 22,
  },
  sheetTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 21,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  dangerButtonWide: {
    borderWidth: 1.5,
    borderColor: theme.colors.text,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  plainButtonWide: {
    marginTop: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
