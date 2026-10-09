import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  Book,
  Friend,
  Handoff,
  Letter,
  RootStackParamList,
  RootTabParamList,
} from './src/types';
import { booksSeed, friends as friendsSeed } from './src/data/mockData';
import {
  createBook,
  createFriend,
  fetchBookClubData,
  joinLine,
  leaveLine,
  recordHandoff,
} from './src/lib/bookClubService';
import { holderId } from './src/lib/bookState';
import { loadReaderId, saveReaderId } from './src/lib/identity';
import { theme } from './src/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { AddBookScreen } from './src/screens/AddBookScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { BookDetailScreen } from './src/screens/BookDetailScreen';

type BookActions = {
  onHandOff: (bookId: string, toFriend: string, letter: Letter) => void;
  onJoinLine: (bookId: string) => void;
  onLeaveLine: (bookId: string) => void;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Outline when idle, solid inside an accent pill when selected. Colour alone
 * was too subtle to read at a glance, so the active tab also changes icon
 * weight and gains a background.
 */
const TAB_ICONS: Record<
  keyof RootTabParamList,
  { active: keyof typeof Ionicons.glyphMap; idle: keyof typeof Ionicons.glyphMap }
> = {
  Home: { active: 'book', idle: 'book-outline' },
  Friends: { active: 'people', idle: 'people-outline' },
  Profile: { active: 'person', idle: 'person-outline' },
};

function TabIcon({
  routeName,
  focused,
  color,
  size,
}: {
  routeName: keyof RootTabParamList;
  focused: boolean;
  color: string;
  size: number;
}) {
  const icons = TAB_ICONS[routeName];

  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Ionicons
        name={focused ? icons.active : icons.idle}
        size={size - 2}
        color={focused ? theme.colors.onAccent : color}
      />
    </View>
  );
}

const tabStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    // Sits just above the tab bar.
    bottom: 104,
    backgroundColor: theme.colors.text,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bannerText: {
    color: theme.colors.card,
    fontSize: 13,
    lineHeight: 18,
  },
  iconWrap: {
    width: 40,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    // Keeps the active pill clear of the label underneath.
    marginBottom: 6,
  },
  iconWrapActive: {
    backgroundColor: theme.colors.accent,
  },
  bar: {
    backgroundColor: theme.colors.card,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    height: 92,
    paddingTop: 10,
    paddingBottom: 26,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 0,
  },
});

function HomeStack({
  books,
  friends,
  currentUserId,
  actions,
  onAddBook,
}: {
  books: Book[];
  friends: Friend[];
  currentUserId: string | null;
  actions: BookActions;
  onAddBook: (book: Book) => void;
}) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.accent,
        headerTitleStyle: { color: theme.colors.text, fontFamily: theme.fonts.serif },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Home" options={{ headerShown: false }}>
        {(props) => <HomeScreen {...props} books={books} currentUserId={currentUserId} />}
      </Stack.Screen>
      <Stack.Screen
        name="BookDetail"
        // The cover block carries title and author, so the header stays
        // empty rather than repeating them.
        options={{ title: '' }}
      >
        {(props) => (
          <BookDetailScreen
            {...props}
            books={books}
            currentUserId={currentUserId}
            {...actions}
          />
        )}
      </Stack.Screen>
      {/* Adding a book is occasional, so it lives behind the + on Home rather
          than taking a permanent tab. */}
      <Stack.Screen name="AddBook" options={{ title: 'Add a book' }}>
        {(props) => (
          <AddBookScreen
            {...props}
            friends={friends}
            currentUserId={currentUserId}
            onAddBook={onAddBook}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function App() {
  const [books, setBooks] = React.useState<Book[]>(booksSeed);
  const [friends, setFriends] = React.useState<Friend[]>(friendsSeed);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(
    friendsSeed[0]?.id ?? null,
  );

  React.useEffect(() => {
    let active = true;

    loadReaderId().then((saved) => {
      if (active && saved) {
        setCurrentUserId(saved);
      }
    });

    fetchBookClubData().then((data) => {
      if (!active) {
        return;
      }

      setBooks(data.books);
      setFriends(data.friends);
      // Keep the remembered reader only if they're still in the group.
      setCurrentUserId((previous) =>
        data.friends.some((friend) => friend.id === previous)
          ? previous
          : data.friends[0]?.id ?? null,
      );
    });

    return () => {
      active = false;
    };
  }, []);

  const chooseReader = (friendId: string) => {
    setCurrentUserId(friendId);
    saveReaderId(friendId);
  };

  /**
   * Writes are optimistic. If one doesn't reach the database, say so rather
   * than let the screen and the stored data quietly disagree.
   */
  const [syncFailed, setSyncFailed] = React.useState(false);
  const track = (write: Promise<boolean>) => {
    write.then((ok) => {
      if (!ok) {
        setSyncFailed(true);
      }
    });
  };

  const updateBook = (bookId: string, change: (book: Book) => Book) => {
    setBooks((currentBooks) =>
      currentBooks.map((candidate) => (candidate.id === bookId ? change(candidate) : candidate)),
    );
  };

  const handleAddBook = (book: Book) => {
    setBooks((currentBooks) => [book, ...currentBooks]);
    track(createBook(book));
  };

  const handleAddFriend = (friend: Friend) => {
    setFriends((currentFriends) => [...currentFriends, friend]);
    track(createFriend(friend));
  };

  /** Sign the current reader up for a book, at the back of the line. */
  const handleJoinLine = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    const me = friends.find((friend) => friend.id === currentUserId);
    if (!book || !me || book.queue.some((entry) => entry.id === me.id)) {
      return;
    }

    const position = Math.max(-1, ...book.queue.map((entry) => entry.position)) + 1;
    updateBook(bookId, (candidate) => ({
      ...candidate,
      queue: [...candidate.queue, { ...me, position, status: 'waiting' }],
    }));
    track(joinLine({ book_id: bookId, friend_id: me.id, position, status: 'waiting' }));
  };

  const handleLeaveLine = (bookId: string) => {
    if (!currentUserId) {
      return;
    }

    updateBook(bookId, (candidate) => ({
      ...candidate,
      queue: candidate.queue.filter(
        (entry) => !(entry.id === currentUserId && entry.status === 'waiting'),
      ),
    }));
    track(leaveLine(bookId, currentUserId));
  };

  /**
   * Append a leg to the book's journey: either to whoever is next in line, or
   * home to its owner. History is never rewritten: the new handoff becomes the
   * newest entry, and location follows from it.
   */
  const handleHandOff = (bookId: string, toFriend: string, letter: Letter) => {
    const book = books.find((candidate) => candidate.id === bookId);
    if (!book) {
      return;
    }

    const fromFriend = holderId(book);
    const handoff: Handoff = {
      id: `handoff-${Date.now()}`,
      bookId,
      fromFriend,
      toFriend,
      happenedAt: new Date().toISOString(),
      note: letter.note?.trim() || undefined,
      rating: letter.rating,
    };

    updateBook(bookId, (candidate) => ({
      ...candidate,
      handoffs: [...candidate.handoffs, handoff],
      queue: candidate.queue.map((entry) => {
        if (entry.id === fromFriend) {
          return { ...entry, status: 'done' as const };
        }
        // An owner getting their copy back has already read it.
        if (entry.id === toFriend && entry.status === 'waiting') {
          return { ...entry, status: 'reading' as const };
        }
        return entry;
      }),
    }));

    track(recordHandoff(handoff));
  };

  const bookActions: BookActions = {
    onHandOff: handleHandOff,
    onJoinLine: handleJoinLine,
    onLeaveLine: handleLeaveLine,
  };

  return (
    <SafeAreaProvider style={tabStyles.root}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                routeName={route.name}
                focused={focused}
                color={color}
                size={size}
              />
            ),
            tabBarActiveTintColor: theme.colors.accent,
            tabBarInactiveTintColor: theme.colors.faint,
            tabBarStyle: tabStyles.bar,
            tabBarLabelStyle: tabStyles.label,
            // Each tab draws its own large serif title.
            headerShown: false,
          })}
        >
          <Tab.Screen name="Home" options={{ title: 'Books' }}>
            {() => (
              <HomeStack
                books={books}
                friends={friends}
                currentUserId={currentUserId}
                actions={bookActions}
                onAddBook={handleAddBook}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Friends">
            {(props) => (
              <FriendsScreen
                {...props}
                friends={friends}
                books={books}
                onAddFriend={handleAddFriend}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Profile" options={{ title: 'You' }}>
            {(props) => (
              <ProfileScreen
                {...props}
                books={books}
                friends={friends}
                currentUserId={currentUserId}
                onChangeUser={chooseReader}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
      {syncFailed && (
        <Pressable style={tabStyles.banner} onPress={() => setSyncFailed(false)}>
          <Text style={tabStyles.bannerText}>
            A change didn't save. It shows here but may be gone next time. Tap to dismiss.
          </Text>
        </Pressable>
      )}
    </SafeAreaProvider>
  );
}
