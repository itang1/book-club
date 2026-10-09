import { useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Book, Friend, Friendship, Group } from '../types';
import { theme } from '../theme';
import { holderId, isInTransit, placeInLine } from '../lib/bookState';
import {
  friendIdsOf,
  groupmateIdsOf,
  incomingRequests,
  outgoingRequests,
  suggestionsFor,
} from '../lib/friendGraph';
import { inviteLink } from '../lib/invite';

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
  onLeaveGroup: (groupId: string) => void;
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
 * Opens the share sheet with the group's invite link. On web without the
 * Share API (most desktop browsers), the link is shown to copy instead.
 */
function InviteButton({ group }: { group: Group }) {
  const [shownLink, setShownLink] = useState<string | null>(null);

  if (!group.inviteCode) {
    return <Text style={styles.muted}>The invite link appears in a moment.</Text>;
  }

  const link = inviteLink(group.inviteCode);
  const invite = async () => {
    try {
      await Share.share({
        message: `Join ${group.name} on Sisterhood of the Traveling Books: ${link}`,
      });
    } catch {
      setShownLink(link);
    }
  };

  return (
    <View>
      <Pressable style={styles.inviteButton} onPress={invite}>
        <Ionicons name="person-add-outline" size={15} color={theme.colors.onAccent} />
        <Text style={styles.inviteButtonText}>Invite to {group.name}</Text>
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

/** One group: name and size, opening to its members, invite, and leave. */
function GroupCard({
  group,
  members,
  currentUserId,
  onLeave,
}: {
  group: Group;
  members: Friend[];
  currentUserId: string | null;
  onLeave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const people = group.memberIds
    .map((id) => members.find((person) => person.id === id))
    .filter((person): person is Friend => Boolean(person));

  return (
    <View style={styles.card}>
      <Pressable style={styles.groupHeader} onPress={() => setOpen((value) => !value)}>
        <Ionicons name="people-outline" size={18} color={theme.colors.accent} />
        <View style={styles.groupTitle}>
          <Text style={styles.groupName}>
            {group.name}
            {group.isSample ? <Text style={styles.sampleTag}>  Sample</Text> : null}
          </Text>
          <Text style={styles.muted}>
            {group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}
          </Text>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.colors.muted}
        />
      </Pressable>

      {open && (
        <View style={styles.groupBody}>
          <Text style={styles.memberList}>
            {people.map((person) => (person.id === currentUserId ? 'You' : person.name)).join(', ')}
          </Text>
          {group.isSample ? (
            <Text style={styles.note}>
              A sample club, so you can see what a group with some history looks like.
              Everyone's in it to look around; nobody can lend or sign up here, and you
              won't see the other real people in it.
            </Text>
          ) : (
            <>
              <Text style={styles.note}>
                Members see each other's books and can join their lines. Nobody outside the
                group can.
              </Text>
              <InviteButton group={group} />
            </>
          )}
          {group.isSample ? null : confirmLeave ? (
            <View style={styles.confirmRow}>
              <Text style={styles.note}>
                Leave {group.name}? You'll stop seeing its books, and come off any lines
                you're waiting in.
              </Text>
              <View style={styles.row}>
                <Pressable style={styles.dangerButton} onPress={onLeave}>
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
          )}
        </View>
      )}
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
  onLeaveGroup,
}: FriendsScreenProps) {
  const insets = useSafeAreaInsets();
  // Who's being unfriended, while the confirmation is up.
  const [unfriending, setUnfriending] = useState<Friend | null>(null);

  const person = (id: string) => members.find((candidate) => candidate.id === id);
  // Your real groups first; the sample club last.
  const myGroups = groups
    .filter((group) => currentUserId && group.memberIds.includes(currentUserId))
    .sort((a, b) => Number(Boolean(a.isSample)) - Number(Boolean(b.isSample)));
  const friendIds = friendIdsOf(friendships, currentUserId);
  const friends = members.filter((candidate) => friendIds.has(candidate.id));
  const requests = incomingRequests(friendships, currentUserId)
    .map(person)
    .filter((candidate): candidate is Friend => Boolean(candidate));
  const asked = outgoingRequests(friendships, currentUserId);
  const askedPeople = members.filter((candidate) => asked.has(candidate.id));
  const suggestions = suggestionsFor(currentUserId, members, friendships, books, groups);
  const groupmates = groupmateIdsOf(groups, currentUserId);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Friends</Text>
      <Text style={styles.subtitle}>
        Friends see what you're reading. To lend to each other, share a group.
      </Text>

      <Text style={styles.sectionTitle}>Your groups</Text>
      {myGroups.length === 0 && (
        <Text style={styles.empty}>
          Books live in groups. Start one, or ask a friend for an invite link.
        </Text>
      )}
      {myGroups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          members={members}
          currentUserId={currentUserId}
          onLeave={() => onLeaveGroup(group.id)}
        />
      ))}
      <StartGroup onCreate={onCreateGroup} />

      {requests.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Requests</Text>
          {requests.map((requester) => (
            <View key={requester.id} style={styles.personRow}>
              <Avatar name={requester.name} />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{requester.name}</Text>
                <Text style={styles.muted}>wants to be friends</Text>
              </View>
              <Pressable style={styles.primarySmall} onPress={() => onAcceptFriend(requester.id)}>
                <Text style={styles.primarySmallText}>Accept</Text>
              </Pressable>
              <Pressable style={styles.plainButton} onPress={() => onRemoveFriend(requester.id)}>
                <Text style={styles.plainButtonText}>Not now</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Friends</Text>
      {friends.length === 0 ? (
        <Text style={styles.empty}>
          No friends yet. Add someone from your groups below.
        </Text>
      ) : (
        friends.map((friend) => (
          <View key={friend.id} style={styles.card}>
            <View style={styles.friendRow}>
              <Avatar name={friend.name} />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{friend.name}</Text>
                <Text style={styles.muted}>
                  {friend.city}, {friend.state}
                </Text>
                <Text style={styles.activity}>{activityFor(friend, books)}</Text>
                {!groupmates.has(friend.id) && (
                  <Text style={styles.activity}>
                    Not in any of your groups yet, so you can't borrow each other's books.
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => setUnfriending(friend)}
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

      <Modal
        visible={unfriending !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setUnfriending(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Unfriend {unfriending?.name.split(' ')[0]}?</Text>
            <Text style={styles.note}>
              {unfriending?.name.split(' ')[0]} won't be told. You'll still share any groups
              you're both in.
            </Text>
            <Pressable
              style={styles.dangerButtonWide}
              onPress={() => {
                if (unfriending) {
                  onRemoveFriend(unfriending.id);
                }
                setUnfriending(null);
              }}
            >
              <Text style={styles.dangerButtonText}>Unfriend</Text>
            </Pressable>
            <Pressable style={styles.plainButtonWide} onPress={() => setUnfriending(null)}>
              <Text style={styles.plainButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    lineHeight: 21,
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
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sampleTag: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  groupBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  memberList: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
    marginBottom: 8,
  },
  confirmRow: {
    marginTop: 12,
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
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  inviteButtonText: {
    marginLeft: 6,
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 14,
  },
  linkBox: {
    marginTop: 10,
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    padding: 10,
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
  leaveLink: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  leaveText: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '700',
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
  requested: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
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
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  primarySmallText: {
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 13,
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
  disabled: {
    opacity: 0.45,
  },
  secondaryButton: {
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
    borderRadius: 20,
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
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  plainButtonWide: {
    marginTop: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
