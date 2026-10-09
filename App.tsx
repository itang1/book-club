import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
import { TabBar } from './src/components/TabBar';
import { JoinGroupPrompt } from './src/components/JoinGroupPrompt';
import { HomeScreen } from './src/screens/HomeScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { AddBookScreen } from './src/screens/AddBookScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { BookDetailScreen } from './src/screens/BookDetailScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { RulesAgreementScreen } from './src/screens/RulesAgreementScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

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
  bannerTitle: {
    color: theme.colors.card,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerText: {
    color: theme.colors.card,
    fontSize: 13,
    lineHeight: 18,
  },
  bannerHint: {
    color: theme.colors.card,
    opacity: 0.75,
    fontSize: 11,
    marginTop: 6,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function HomeStack({ club }: { club: BookClub }) {
  const me = club.members.find((person) => person.id === club.currentUserId) ?? null;
  const myGroups = club.groups.filter(
    (group) => club.currentUserId && group.memberIds.includes(club.currentUserId),
  );

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
            groups={club.groups}
            currentUserId={club.currentUserId}
            onHandOff={club.handOff}
            onMarkReceived={club.markReceived}
            onJoinLine={club.joinLine}
            onLeaveLine={club.leaveLine}
          />
        )}
      </Stack.Screen>
      {/* Adding a book is occasional, so it lives behind the + on Home rather
          than taking a permanent tab. */}
      <Stack.Screen name="AddBook" options={{ title: 'Lend a new book' }}>
        {(props) => (
          <AddBookScreen
            {...props}
            owner={me}
            members={club.members}
            groups={myGroups}
            onAddBook={club.addBook}
            onCreateGroup={club.createGroup}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function Tabs({ club }: { club: BookClub }) {
  const me = club.members.find((person) => person.id === club.currentUserId) ?? null;

  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <TabBar {...props} />}
        // Each tab draws its own large serif title.
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home" options={{ title: 'Books' }}>
          {() => <HomeStack club={club} />}
        </Tab.Screen>
        <Tab.Screen name="Friends">
          {() => (
            <FriendsScreen
              members={club.members}
              friendships={club.friendships}
              groups={club.groups}
              books={club.books}
              currentUserId={club.currentUserId}
              onRequestFriend={club.requestFriend}
              onAcceptFriend={club.acceptFriend}
              onRemoveFriend={club.removeFriend}
              onCreateGroup={club.createGroup}
              onLeaveGroup={club.leaveGroup}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Profile" options={{ title: 'You' }}>
          {() => (
            <ProfileScreen
              books={club.books}
              me={me}
              friendCount={friendIdsOf(club.friendships, club.currentUserId).size}
              email={club.usesAccounts ? club.email : null}
              onSignOut={club.signOut}
              onUpdateProfile={club.updateProfile}
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
  const me = club.members.find((person) => person.id === club.currentUserId);

  let body: React.ReactNode;
  if (!club.loaded) {
    body = (
      <View style={tabStyles.loading}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  } else if (club.usesAccounts && !club.signedIn) {
    body = <SignInScreen />;
  } else if (!club.currentUserId) {
    body = (
      <WelcomeScreen
        demoMembers={club.usesAccounts ? undefined : club.members}
        onClaim={club.claimExisting}
        onCreate={club.createProfile}
        email={club.usesAccounts ? club.email : null}
        onSignOut={club.usesAccounts ? club.signOut : undefined}
      />
    );
  } else if (me && !me.agreedRulesAt) {
    // Once per person, right after joining.
    body = (
      <RulesAgreementScreen firstName={me.name.split(' ')[0]} onAgree={club.agreeToRules} />
    );
  } else {
    body = (
      <>
        <Tabs club={club} />
        {/* Someone signed in who opened an invite link: join, or not now. */}
        <JoinGroupPrompt
          groups={club.groups}
          currentUserId={club.currentUserId}
          onJoin={club.joinGroup}
        />
      </>
    );
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
      {club.saveProblem && (
        <Pressable style={tabStyles.banner} onPress={club.dismissSaveProblem}>
          <Text style={tabStyles.bannerTitle}>Couldn't {club.saveProblem.action}.</Text>
          <Text style={tabStyles.bannerText}>{club.saveProblem.reason}</Text>
          <Text style={tabStyles.bannerHint}>
            It shows here for now but won't be there next time. Tap to dismiss.
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
