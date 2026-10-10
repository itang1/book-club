import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Book, EmailPrefs, Friend } from '../types';
import { theme } from '../theme';
import { MonthlyColumns } from '../components/MonthlyColumns';
import { PassportStamps } from '../components/PassportStamps';
import { EditProfileSheet } from '../components/EditProfileSheet';
import { EmailSettings } from '../components/EmailSettings';
import { finishesByMonth, placesForOwner } from '../lib/stats';
import {
  friendNameIn,
  hasFinished,
  hasLetter,
  holderId,
  isInTransit,
  lastActivityAt,
  nextInLineId,
  relativeTime,
  senderId,
} from '../lib/bookState';

type ProfileScreenProps = {
  books: Book[];
  me: Friend | null;
  friendCount: number;
  /** With real accounts: who's signed in, and the way out. */
  email?: string | null;
  onSignOut?: () => void;
  onUpdateProfile: (changes: Pick<Friend, 'name' | 'city' | 'state'>) => void;
  onUpdateEmailPrefs: (prefs: EmailPrefs) => void;
  onUpdateFriendRequestsFrom: (value: 'groups' | 'nobody') => void;
};

/**
 * Just you: who you are, and the books in your life right now. Switching
 * between people is a development tool and lives in the dev bar, not here.
 */
export function ProfileScreen({
  books,
  me,
  friendCount,
  email,
  onSignOut,
  onUpdateProfile,
  onUpdateEmailPrefs,
  onUpdateFriendRequestsFrom,
}: ProfileScreenProps) {
  const insets = useSafeAreaInsets();

  const [editing, setEditing] = useState(false);
  // In your hands means arrived; a book in the post to you is coming, along
  // with any you're next in line for.
  const withMe = me
    ? books.filter((book) => holderId(book) === me.id && !isInTransit(book))
    : [];
  const comingToMe = me
    ? books.filter(
        (book) =>
          (holderId(book) === me.id && isInTransit(book)) || nextInLineId(book) === me.id,
      )
    : [];
  // From the log, so a reread in progress doesn't un-finish the first read.
  const finished = me ? books.filter((book) => hasFinished(book, me.id)) : [];
  const lettersWritten = me
    ? books.reduce(
        (sum, book) =>
          sum + book.handoffs.filter((leg) => leg.fromFriend === me.id && hasLetter(leg)).length,
        0,
      )
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{me?.name.charAt(0) ?? '?'}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{me?.name ?? 'You'}</Text>
          {me && (
            <Text style={styles.subtitle}>
              {me.city}, {me.state} · {friendCount} {friendCount === 1 ? 'friend' : 'friends'}
            </Text>
          )}
        </View>
        {me && (
          <Pressable style={styles.editButton} onPress={() => setEditing(true)}>
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        )}
      </View>
      {me && (
        <EditProfileSheet
          me={me}
          visible={editing}
          onClose={() => setEditing(false)}
          onSave={onUpdateProfile}
        />
      )}

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{withMe.length}</Text>
          <Text style={styles.statLabel}>With you now</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{comingToMe.length}</Text>
          <Text style={styles.statLabel}>Coming to you</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{finished.length}</Text>
          <Text style={styles.statLabel}>Books finished</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{lettersWritten}</Text>
          <Text style={styles.statLabel}>Letters written</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>In your hands</Text>
        {withMe.length === 0 ? (
          <Text style={styles.empty}>Nothing right now. Enjoy the quiet.</Text>
        ) : (
          withMe.map((book) => (
            <View key={book.id} style={styles.bookRow}>
              <View style={[styles.swatch, { backgroundColor: book.coverColor }]} />
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.bookMeta}>
                  Arrived {relativeTime(lastActivityAt(book))}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>On its way to you</Text>
        {comingToMe.length === 0 ? (
          <Text style={styles.empty}>Nothing on its way. Join a line and something will find you.</Text>
        ) : (
          comingToMe.map((book) => (
            <View key={book.id} style={styles.bookRow}>
              <View style={[styles.swatch, { backgroundColor: book.coverColor }]} />
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.bookMeta}>
                  {/* In the post counts as coming to you only when it's
                      addressed to you; in the post to someone else, you're
                      next after them. */}
                  {isInTransit(book) && holderId(book) === me?.id
                    ? `In the post from ${friendNameIn(book, senderId(book)).split(' ')[0]}`
                    : isInTransit(book)
                      ? `You're next. In the post to ${friendNameIn(book, holderId(book)).split(' ')[0]}`
                      : `You're next. Currently with ${friendNameIn(book, holderId(book)).split(' ')[0]}`}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your reading</Text>
        <MonthlyColumns data={finishesByMonth(books, me?.id ?? null)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Where your books have been</Text>
        <PassportStamps places={placesForOwner(books, me?.id ?? null)} />
      </View>

      {me && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Emails</Text>
          <EmailSettings
            prefs={
              me.emails ?? { bookSent: true, bookArrived: true, nextInLine: true, friendRequest: true }
            }
            onChange={onUpdateEmailPrefs}
          />
        </View>
      )}

      {me && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Friend requests</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Let people in my groups ask</Text>
              <Text style={styles.settingDetail}>
                Off means nobody can send you a request. You can still ask others.
              </Text>
            </View>
            <Switch
              value={(me.friendRequestsFrom ?? 'groups') === 'groups'}
              onValueChange={(on) => onUpdateFriendRequestsFrom(on ? 'groups' : 'nobody')}
              trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
              thumbColor={theme.colors.card}
              accessibilityLabel="Let people in my groups send friend requests"
            />
          </View>
        </View>
      )}

      {email && onSignOut && (
        <Pressable style={styles.signOut} onPress={onSignOut}>
          <Text style={styles.signOutText}>Signed in as {email} · Sign out</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  signOut: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  signOutText: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
    paddingRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  settingDetail: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
    marginTop: 2,
  },
  editButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  editButtonText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontFamily: theme.fonts.serif,
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.text,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 14,
    marginTop: 2,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  statValue: {
    fontFamily: theme.fonts.serif,
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statLabel: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.muted,
  },
  empty: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  swatch: {
    width: 34,
    height: 46,
    borderRadius: 6,
    marginRight: 12,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  bookMeta: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
});
