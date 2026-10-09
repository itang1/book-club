import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Book, Friend, RootStackParamList, RootTabParamList } from './src/types';
import { booksSeed, friends as friendsSeed } from './src/data/mockData';
import {
  createBook,
  createFriend,
  fetchBookClubData,
  recordHandoff,
} from './src/lib/bookClubService';
import { currentOwnerId, nextInLineId } from './src/lib/bookState';
import { HomeScreen } from './src/screens/HomeScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { AddBookScreen } from './src/screens/AddBookScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { BookDetailScreen } from './src/screens/BookDetailScreen';

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
  AddBook: { active: 'add-circle', idle: 'add-circle-outline' },
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
        color={focused ? '#fff' : color}
      />
    </View>
  );
}

const tabStyles = StyleSheet.create({
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
    backgroundColor: '#7a5c48',
  },
  bar: {
    backgroundColor: '#fffdfb',
    borderTopColor: '#eaded3',
    borderTopWidth: 1,
    height: 92,
    paddingTop: 10,
    paddingBottom: 26,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 0,
  },
});

function HomeStack({
  books,
  onPassOn,
}: {
  books: Book[];
  onPassOn: (bookId: string) => void;
}) {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        children={(props) => <HomeScreen {...props} books={books} />}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookDetail"
        children={(props) => (
          <BookDetailScreen {...props} books={books} onPassOn={onPassOn} />
        )}
        options={{
          // The cover block carries title and author, so the header stays
          // empty rather than repeating them.
          title: '',
          headerShadowVisible: false,
        }}
      />
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

    fetchBookClubData().then((data) => {
      if (!active) {
        return;
      }

      setBooks(data.books);
      setFriends(data.friends);
      setCurrentUserId((previous) => previous ?? data.friends[0]?.id ?? null);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleAddBook = (book: Book) => {
    setBooks((currentBooks) => [book, ...currentBooks]);
    createBook(book);
  };

  const handleAddFriend = (friend: Friend) => {
    setFriends((currentFriends) => [...currentFriends, friend]);
    createFriend(friend);
  };

  /**
   * Append a leg to the book's journey. History is never rewritten: the new
   * handoff becomes the newest entry, and location follows from it.
   */
  const handlePassOn = (bookId: string) => {
    const book = books.find((candidate) => candidate.id === bookId);
    if (!book) {
      return;
    }

    const fromFriend = currentOwnerId(book);
    const toFriend = nextInLineId(book);
    if (!toFriend) {
      return;
    }

    const handoff = {
      id: `handoff-${Date.now()}`,
      bookId,
      fromFriend,
      toFriend,
      happenedAt: new Date().toISOString(),
    };

    const nextStatus: Book['status'] = 'in-transit';

    setBooks((currentBooks) =>
      currentBooks.map((candidate) =>
        candidate.id === bookId
          ? {
              ...candidate,
              status: nextStatus,
              handoffs: [...candidate.handoffs, handoff],
              queue: candidate.queue.map((entry) => {
                if (entry.id === fromFriend) {
                  return { ...entry, status: 'done' as const };
                }
                if (entry.id === toFriend) {
                  return { ...entry, status: 'reading' as const };
                }
                return entry;
              }),
            }
          : candidate,
      ),
    );

    recordHandoff(handoff, nextStatus);
  };

  return (
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
          tabBarActiveTintColor: '#7a5c48',
          tabBarInactiveTintColor: '#8a7d76',
          tabBarStyle: tabStyles.bar,
          tabBarLabelStyle: tabStyles.label,
          headerStyle: { backgroundColor: '#f7f1ea' },
          headerTitleStyle: { color: '#1f1a17' },
        })}
      >
        <Tab.Screen
          name="Home"
          children={() => <HomeStack books={books} onPassOn={handlePassOn} />}
          options={{ headerShown: false }}
        />
        <Tab.Screen name="Friends">
          {(props) => <FriendsScreen {...props} friends={friends} books={books} />}
        </Tab.Screen>
        <Tab.Screen name="AddBook" options={{ title: 'Add Book' }}>
          {(props) => (
            <AddBookScreen
              {...props}
              friends={friends}
              onAddBook={handleAddBook}
              onAddFriend={handleAddFriend}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Profile">
          {(props) => (
            <ProfileScreen
              {...props}
              books={books}
              friends={friends}
              currentUserId={currentUserId}
              onChangeUser={setCurrentUserId}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
