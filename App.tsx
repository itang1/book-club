import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Book, Friend, RootStackParamList, RootTabParamList } from './src/types';
import { booksSeed, friends as friendsSeed } from './src/data/mockData';
import { HomeScreen } from './src/screens/HomeScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { AddBookScreen } from './src/screens/AddBookScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { BookDetailScreen } from './src/screens/BookDetailScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeStack({ books }: { books: Book[] }) {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        children={(props) => <HomeScreen {...props} books={books} />}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookDetail"
        children={(props) => <BookDetailScreen {...props} books={books} />}
        options={({ route }) => ({
          title: route.params?.bookTitle ?? 'Book Detail',
        })}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [books, setBooks] = React.useState<Book[]>(booksSeed);
  const [friends, setFriends] = React.useState<Friend[]>(friendsSeed);

  const handleAddBook = (book: Book) => {
    setBooks((currentBooks) => [book, ...currentBooks]);
  };

  const handleAddFriend = (friend: Friend) => {
    setFriends((currentFriends) => [friend, ...currentFriends]);
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            const iconName =
              route.name === 'Home'
                ? 'book-outline'
                : route.name === 'Friends'
                  ? 'people-outline'
                  : route.name === 'AddBook'
                    ? 'add-circle-outline'
                    : 'person-outline';

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#7a5c48',
          tabBarInactiveTintColor: '#8a7d76',
          headerStyle: { backgroundColor: '#f7f1ea' },
          headerTitleStyle: { color: '#1f1a17' },
        })}
      >
        <Tab.Screen
          name="Home"
          children={() => <HomeStack books={books} />}
          options={{ headerShown: false }}
        />
        <Tab.Screen name="Friends">
          {(props) => <FriendsScreen {...props} friends={friends} />}
        </Tab.Screen>
        <Tab.Screen name="AddBook">
          {(props) => <AddBookScreen {...props} friends={friends} onAddBook={handleAddBook} onAddFriend={handleAddFriend} />}
        </Tab.Screen>
        <Tab.Screen name="Profile">
          {(props) => <ProfileScreen {...props} books={books} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
