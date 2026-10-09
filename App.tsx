import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SafeAreaInsetsContext,
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { RootStackParamList, RootTabParamList } from './src/types';
import { BookClub, useBookClub } from './src/lib/useBookClub';
import { friendIdsOf } from './src/lib/friendGraph';
import { isDevMode } from './src/lib/devMode';
import { theme } from './src/theme';
import { DevBar } from './src/components/DevBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { AddBookScreen } from './src/screens/AddBookScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { BookDetailScreen } from './src/screens/BookDetailScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';

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
    backgroundColor: theme.colors.background,
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

function HomeStack({ club }: { club: BookClub }) {
  const me = club.members.find((person) => person.id === club.currentUserId) ?? null;

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
        {(props) => (
          <HomeScreen
            {...props}
            books={club.books}
            currentUserId={club.currentUserId}
            refreshing={club.refreshing}
            onRefresh={club.refresh}
          />
        )}
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
            books={club.books}
            currentUserId={club.currentUserId}
            onHandOff={club.handOff}
            onJoinLine={club.joinLine}
            onLeaveLine={club.leaveLine}
          />
        )}
      </Stack.Screen>
      {/* Adding a book is occasional, so it lives behind the + on Home rather
          than taking a permanent tab. */}
      <Stack.Screen name="AddBook" options={{ title: 'Add a book' }}>
        {(props) => <AddBookScreen {...props} owner={me} onAddBook={club.addBook} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function Tabs({ club }: { club: BookClub }) {
  const me = club.members.find((person) => person.id === club.currentUserId) ?? null;

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon routeName={route.name} focused={focused} color={color} size={size} />
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
          {() => <HomeStack club={club} />}
        </Tab.Screen>
        <Tab.Screen name="Friends">
          {() => (
            <FriendsScreen
              members={club.members}
              friendships={club.friendships}
              books={club.books}
              currentUserId={club.currentUserId}
              onAddFriend={club.addFriend}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Profile" options={{ title: 'You' }}>
          {() => (
            <ProfileScreen
              books={club.books}
              me={me}
              friendCount={friendIdsOf(club.friendships, club.currentUserId).size}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function Root() {
  const club = useBookClub();
  const insets = useSafeAreaInsets();

  let body: React.ReactNode;
  if (!club.loaded) {
    body = (
      <View style={tabStyles.loading}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  } else if (!club.currentUserId) {
    body = (
      <WelcomeScreen
        members={club.members}
        onCreate={club.createProfile}
        onPick={club.chooseReader}
      />
    );
  } else {
    body = <Tabs club={club} />;
  }

  return (
    <View style={tabStyles.root}>
      {isDevMode && (
        <DevBar
          members={club.members}
          currentUserId={club.currentUserId}
          onChoose={club.chooseReader}
          onSignOut={club.signOut}
        />
      )}
      {/* The dev bar already clears the status bar, so screens below it are
          told the top inset is zero rather than padding for it twice. */}
      <SafeAreaInsetsContext.Provider value={isDevMode ? { ...insets, top: 0 } : insets}>
        <View style={tabStyles.root}>{body}</View>
      </SafeAreaInsetsContext.Provider>
      {club.syncFailed && (
        <Pressable style={tabStyles.banner} onPress={club.dismissSyncError}>
          <Text style={tabStyles.bannerText}>
            A change didn't save. It shows here but may be gone next time. Tap to dismiss.
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}
