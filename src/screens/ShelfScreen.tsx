import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Book, Friend, Group, ScannedBook, ShelfStackParamList } from '../types';
import { theme } from '../theme';
import { PickGroupSheet } from '../components/PickGroupSheet';
import { ScanReviewSheet } from '../components/ScanReviewSheet';
import { ShelfRow } from '../components/ShelfRow';
import { scanShelfPhoto, type ShelfState } from '../lib/shelf';
import { sameBook } from '../lib/shelfBooks';

type ShelfScreenProps = {
  navigation: NativeStackNavigationProp<ShelfStackParamList, 'ShelfHome'>;
  shelf: ShelfState;
  me: Friend | null;
  members: Friend[];
  /** Your groups (real ones you belong to): where a shelf book can be lent. */
  groups: Group[];
  books: Book[];
};

const first = (name: string) => name.split(' ')[0];

export function ShelfScreen({ navigation, shelf, me, members, groups, books }: ShelfScreenProps) {
  const insets = useSafeAreaInsets();
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [found, setFound] = useState<ScannedBook[] | null>(null);
  const [lending, setLending] = useState<string | null>(null);
  const [lendProblem, setLendProblem] = useState<string | null>(null);

  const mine = shelf.books.filter((book) => book.ownerId === me?.id);
  const lending_ = mine.find((book) => book.id === lending);
  const shelves = useMemo(
    () =>
      members
        .filter((person) => person.id !== me?.id)
        .map((person) => ({
          person,
          count: shelf.books.filter((book) => book.ownerId === person.id).length,
        }))
        .filter(({ count }) => count > 0),
    [members, shelf.books, me?.id],
  );
  const asks = shelf.requests.filter((request) =>
    mine.some((book) => book.id === request.shelfBookId),
  );
  const nameOf = (id: string) => members.find((person) => person.id === id)?.name ?? 'Someone';

  const scan = async (fromCamera: boolean) => {
    setMessage(null);
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      base64: true,
      // Re-encoded smaller: a shelf photo straight off a phone is far bigger than needed.
      quality: 0.5,
    };
    if (fromCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setMessage('Allow camera access to take a photo, or choose one from your library.');
        return;
      }
    }
    const picked = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    const asset = picked.canceled ? null : picked.assets[0];
    if (!asset?.base64) return;

    setScanning(true);
    const result = await scanShelfPhoto(asset.base64, asset.mimeType ?? 'image/jpeg');
    setScanning(false);
    if (result.error) {
      setMessage(result.error);
    } else if (result.books.length === 0) {
      setMessage('No titles could be read. Try a closer, brighter photo of a few shelves at a time.');
    } else {
      setFound(result.books);
    }
  };

  const activeLentBook = (lentBookId: string | null) =>
    lentBookId ? books.find((book) => book.id === lentBookId && !book.archivedAt) : undefined;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      refreshControl={<RefreshControl refreshing={shelf.loading} onRefresh={shelf.reload} />}
    >
      <Text style={styles.heading}>Your shelf</Text>
      <Text style={styles.sub}>
        Photograph your shelves and we'll read the spines. People in your groups can see what you
        have and ask to borrow it, and you can lend any book to a group. Photos are sent to Google's
        Gemini to read the spines and aren't saved here.
      </Text>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.primary, scanning && styles.disabled]}
          disabled={scanning}
          onPress={() => scan(true)}
          accessibilityRole="button"
        >
          <Ionicons name="camera" size={18} color={theme.colors.onAccent} />
          <Text style={styles.primaryText}>{scanning ? 'Reading…' : 'Scan with camera'}</Text>
        </Pressable>
        <Pressable
          style={[styles.secondary, scanning && styles.disabled]}
          disabled={scanning}
          onPress={() => scan(false)}
          accessibilityRole="button"
        >
          <Ionicons name="image-outline" size={18} color={theme.colors.accent} />
          <Text style={styles.secondaryText}>Choose a photo</Text>
        </Pressable>
        <Pressable
          style={styles.secondary}
          onPress={() => setFound([{ title: '', author: '' }])}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={18} color={theme.colors.accent} />
          <Text style={styles.secondaryText}>Add by hand</Text>
        </Pressable>
      </View>
      {message && <Text style={styles.message}>{message}</Text>}
      {shelf.error && <Text style={styles.message}>{shelf.error}</Text>}

      {asks.some((request) => request.status === 'pending') && (
        <>
          <Text style={styles.section}>Asking to borrow</Text>
          {asks
            .filter((request) => request.status === 'pending')
            .map((request) => {
              const book = mine.find((candidate) => candidate.id === request.shelfBookId);
              if (!book) return null;
              return (
                <ShelfRow
                  key={request.id}
                  book={book}
                  status={`${first(nameOf(request.requesterId))} would like to read this.`}
                  actions={[
                    { label: 'Yes', onPress: () => shelf.answerRequest(request.id, true) },
                    { label: 'Not now', quiet: true, onPress: () => shelf.answerRequest(request.id, false) },
                  ]}
                />
              );
            })}
        </>
      )}

      <Text style={styles.section}>
        {mine.length === 0 ? 'Nothing here yet' : `${mine.length} ${mine.length === 1 ? 'book' : 'books'}`}
      </Text>
      {mine.map((book) => {
        const lent = activeLentBook(book.lentBookId);
        const accepted = asks.filter(
          (request) => request.shelfBookId === book.id && request.status === 'accepted',
        );
        return (
          <ShelfRow
            key={book.id}
            book={book}
            status={
              lent
                ? `Out travelling in ${groups.find((group) => group.id === lent.groupId)?.name ?? 'a group'}`
                : accepted.length > 0
                  ? `You said yes to ${accepted.map((request) => first(nameOf(request.requesterId))).join(', ')}. Lend it to a group you share.`
                  : undefined
            }
            actions={
              lent
                ? [{ label: 'See its journey', onPress: () => navigation.getParent()?.navigate('Home', { screen: 'BookDetail', params: { bookId: lent.id } }) }]
                : [
                    { label: 'Lend to a group', onPress: () => { setLendProblem(null); setLending(book.id); } },
                    { label: 'Remove', quiet: true, onPress: () => shelf.removeBook(book.id) },
                  ]
            }
          />
        );
      })}

      {shelves.length > 0 && (
        <>
          <Text style={styles.section}>Shelves in your groups</Text>
          {shelves.map(({ person, count }) => (
            <Pressable
              key={person.id}
              style={styles.person}
              onPress={() => navigation.navigate('PersonShelf', { personId: person.id })}
              accessibilityRole="button"
            >
              <Text style={styles.personName}>{person.name}</Text>
              <Text style={styles.personCount}>
                {count} {count === 1 ? 'book' : 'books'} ›
              </Text>
            </Pressable>
          ))}
        </>
      )}

      <ScanReviewSheet
        visible={found !== null}
        found={found ?? []}
        isShelved={(book) => mine.some((existing) => sameBook(existing, book))}
        onClose={() => setFound(null)}
        onAdd={(chosen) => (me ? shelf.addBooks(me.id, chosen) : Promise.resolve('Make your profile first.'))}
      />
      <PickGroupSheet
        title={lending_?.title ?? null}
        groups={groups}
        problem={lendProblem}
        onClose={() => setLending(null)}
        onPick={async (group) => {
          if (!lending_) return;
          const problem = await shelf.lendToGroup(lending_.id, group.id);
          if (problem) setLendProblem(problem);
          else setLending(null);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  heading: { fontFamily: theme.fonts.serif, fontSize: 28, fontWeight: '700', color: theme.colors.text },
  sub: { fontSize: 14, lineHeight: 20, color: theme.colors.muted, marginTop: 6, marginBottom: 16 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  primaryText: { color: theme.colors.onAccent, fontWeight: '700', fontSize: 14 },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.soft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  secondaryText: { color: theme.colors.accent, fontWeight: '700', fontSize: 14 },
  disabled: { opacity: 0.5 },
  message: { fontSize: 13, color: theme.colors.text, fontWeight: '600', marginTop: 10 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.muted,
    marginTop: 24,
    marginBottom: 10,
  },
  person: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 8,
  },
  personName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  personCount: { fontSize: 13, color: theme.colors.muted },
});
