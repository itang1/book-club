import * as React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SafeAreaInsetsContext,
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  Friend,
  FriendsStackParamList,
  RootStackParamList,
  RootTabParamList,
  ShelfStackParamList,
} from './src/types';
import { BookClub, useBookClub } from './src/lib/useBookClub';
import { friendIdsOf, incomingRequests } from './src/lib/friendGraph';
import { holderId, isInTransit } from './src/lib/bookState';
import { isDevMode } from './src/lib/devMode';
import { clearEmailActionFromUrl, emailActionTokenFromUrl, linking } from './src/lib/links';
import { theme } from './src/theme';
import { countMilestone } from './src/lib/analytics';
import { inviteCodeFromUrl } from './src/lib/invite';
import { registerFonts } from './src/fonts';
import { startMonitoring } from './src/lib/monitoring';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { DevBar } from './src/components/DevBar';
import { TabBar } from './src/components/TabBar';
import { JoinGroupPrompt } from './src/components/JoinGroupPrompt';
import { HomeScreen } from './src/screens/HomeScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { AddBookScreen } from './src/screens/AddBookScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { BookDetailScreen } from './src/screens/BookDetailScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { GroupScreen } from './src/screens/GroupScreen';
import { ShelfScreen } from './src/screens/ShelfScreen';
import { PersonShelfScreen } from './src/screens/PersonShelfScreen';
import { useShelf } from './src/lib/shelf';
import { SignInScreen } from './src/screens/SignInScreen';
import { useBlocks } from './src/lib/blocks';
import { RulesAgreementScreen } from './src/screens/RulesAgreementScreen';
import { EmailActionScreen } from './src/screens/EmailActionScreen';

/**
 * The one-time rules agreement, for people who join. Whoever already had an
 * account when it was switched on isn't asked, and neither is the demo.
 */
const asksToAgree = (me: Friend, usesAccounts: boolean) =>
  usesAccounts && !me.agreedRulesAt && !me.joinedBeforeRules;

registerFonts();
startMonitoring();

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const FriendsNav = createNativeStackNavigator<FriendsStackParamList>();
const ShelfNav = createNativeStackNavigator<ShelfStackParamList>();

/** Inner pages (a book, a group, lending) wear the letterhead green too. */
const stackHeader = {
  headerStyle: { backgroundColor: theme.colors.letterhead },
  headerTintColor: theme.colors.onMasthead,
  headerTitleStyle: { color: theme.colors.onMasthead, fontFamily: theme.fonts.serif },
  headerShadowVisible: false,
} as const;

const tabStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 104,
    backgroundColor: theme.colors.letterhead,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.brass,
    borderRadius: theme.radius.md,
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
    fontSize: 12,
    marginTop: 6,
  },
  loadingCrest: {
    width: 60,
    height: 72,
    marginBottom: 20,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.letterhead,
  },
});

function HomeStack({ club }: { club: BookClub }) {
  const me = club.members.find((person) => person.id === club.currentUserId) ?? null;
  const myGroups = club.groups.filter(
    (group) =>
      !group.isSample && club.currentUserId && group.memberIds.includes(club.currentUserId),
  );

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackHeader,
      }}
    >
      <Stack.Screen name="Home" options={{ headerShown: false }}>
        {(props) => (
          <HomeScreen
            {...props}
            books={club.books}
            groups={club.groups}
            currentUserId={club.currentUserId}
            refreshing={club.refreshing}
            onRefresh={club.refresh}
            canScanShelf={club.usesAccounts}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="BookDetail"
        // The cover carries the title, so the header shows only a quiet
        // "Book"; screen readers still get a real heading rather than an empty one.
        options={{ title: 'Book' }}
      >
        {(props) => (
          <BookDetailScreen
            {...props}
            books={club.books}
            groups={club.groups}
            currentUserId={club.currentUserId}
            onHandOff={club.handOff}
            onMarkReceived={club.markReceived}
            onChangeCover={club.changeCover}
            onUpdateBookDetails={club.updateBookDetails}
            onRetireBook={club.retireBook}
            onUnretireBook={club.unretireBook}
            onCallHome={club.callHome}
            onCancelCallHome={club.cancelCallHome}
            onJoinLine={club.joinLine}
            onLeaveLine={club.leaveLine}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="AddBook" options={{ title: 'Lend a new book' }}>
        {(props) => (
          <AddBookScreen
            {...props}
            owner={me}
            members={club.members}
            groups={myGroups}
            onAddBook={club.addBook}
            onCreateGroup={club.createGroup}
            canScanShelf={club.usesAccounts}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function FriendsStack({ club }: { club: BookClub }) {
  const blocks = useBlocks(club.currentUserId);
  return (
    <FriendsNav.Navigator
      screenOptions={{
        ...stackHeader,
      }}
    >
      <FriendsNav.Screen name="FriendsHome" options={{ headerShown: false }}>
        {({ navigation }) => (
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
            onOpenGroup={(groupId) => navigation.navigate('Group', { groupId })}
            blocks={blocks}
          />
        )}
      </FriendsNav.Screen>
      <FriendsNav.Screen name="Group" options={{ title: '' }}>
        {({ navigation, route }) => (
          <GroupScreen
            route={route}
            groups={club.groups}
            members={club.members}
            books={club.books}
            currentUserId={club.currentUserId}
            onOpenBook={(bookId) =>
              navigation.getParent()?.navigate('Home', { screen: 'BookDetail', params: { bookId } })
            }
            onLeave={club.leaveGroup}
            onRename={club.renameGroup}
            onRemoveMember={club.removeFromGroup}
            onHandOver={club.handOverGroup}
            onResetInvite={club.resetInviteLink}
            onSetPace={club.setGroupPace}
            blocks={blocks}
            onBlocked={club.removeFriend}
            onLeft={() => navigation.navigate('FriendsHome')}
          />
        )}
      </FriendsNav.Screen>
    </FriendsNav.Navigator>
  );
}

function ShelfStack({ club }: { club: BookClub }) {
  const me = club.members.find((person) => person.id === club.currentUserId) ?? null;
  const shelf = useShelf(club.usesAccounts && me !== null);
  const myGroups = club.groups.filter(
    (group) =>
      !group.isSample && club.currentUserId && group.memberIds.includes(club.currentUserId),
  );

  return (
    <ShelfNav.Navigator
      screenOptions={{
        ...stackHeader,
      }}
    >
      <ShelfNav.Screen name="ShelfHome" options={{ headerShown: false }}>
        {({ navigation }) => (
          <ShelfScreen
            navigation={navigation}
            shelf={shelf}
            me={me}
            members={club.members}
            groups={myGroups}
            books={club.books}
          />
        )}
      </ShelfNav.Screen>
      <ShelfNav.Screen name="PersonShelf" options={{ title: '' }}>
        {(props) => (
          <PersonShelfScreen
            {...props}
            shelf={shelf}
            me={me}
            members={club.members}
            books={club.books}
          />
        )}
      </ShelfNav.Screen>
    </ShelfNav.Navigator>
  );
}

function Tabs({ club, justJoined = false }: { club: BookClub; justJoined?: boolean }) {
  const me = club.members.find((person) => person.id === club.currentUserId) ?? null;
  const incomingBookCount = club.books.filter(
    (book) => club.currentUserId && holderId(book) === club.currentUserId && isInTransit(book),
  ).length;
  const pendingRequestsCount = club.currentUserId
    ? incomingRequests(club.friendships, club.currentUserId).length
    : 0;

  return (
    <NavigationContainer linking={linking}>
      <Tab.Navigator
        // Someone who has just joined starts at their bookshelf: one photo fills it.
        initialRouteName={justJoined && club.usesAccounts ? 'Shelf' : 'Home'}
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen
          name="Home"
          options={{
            title: 'Books',
            tabBarBadge: incomingBookCount > 0 ? incomingBookCount : undefined,
          }}
        >
          {() => <HomeStack club={club} />}
        </Tab.Screen>
        {club.usesAccounts && (
          <Tab.Screen name="Shelf" options={{ title: 'Bookshelf' }}>
            {() => <ShelfStack club={club} />}
          </Tab.Screen>
        )}
        <Tab.Screen
          name="Friends"
          options={{
            title: 'Friends & Groups',
            tabBarBadge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
          }}
        >
          {() => <FriendsStack club={club} />}
        </Tab.Screen>
        <Tab.Screen name="Profile" options={{ title: 'Profile' }}>
          {() => (
            <ProfileScreen
              books={club.books}
              me={me}
              friendCount={friendIdsOf(club.friendships, club.currentUserId).size}
              email={club.usesAccounts ? club.email : null}
              onSignOut={club.signOut}
              onDeleteAccount={club.usesAccounts ? club.deleteAccount : undefined}
              onUpdateProfile={club.updateProfile}
              onUpdateEmailPrefs={club.updateEmailPrefs}
              onUpdateFriendRequestsFrom={club.updateFriendRequestsFrom}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function Root() {
  const club = useBookClub();
  const [emailToken, setEmailToken] = React.useState(emailActionTokenFromUrl);
  const [justJoined, setJustJoined] = React.useState(false);
  React.useEffect(() => {
    if (emailToken) {
      clearEmailActionFromUrl();
    }
  }, [emailToken]);
  const insets = useSafeAreaInsets();
  const me = club.members.find((person) => person.id === club.currentUserId);

  let body: React.ReactNode;
  if (emailToken) {
    body = <EmailActionScreen token={emailToken} onClose={() => setEmailToken(null)} />;
  } else if (!club.loaded) {
    body = (
      <View style={tabStyles.loading}>
        <Image
          source={require('./assets/crest.png')}
          style={tabStyles.loadingCrest}
          accessibilityLabel="The Traveling Books"
        />
        <ActivityIndicator color={theme.colors.brass} />
      </View>
    );
  } else if (club.usesAccounts && !club.signedIn) {
    body = <SignInScreen />;
  } else if (!club.currentUserId) {
    body = (
      <WelcomeScreen
        demoMembers={club.usesAccounts ? undefined : club.members}
        onClaim={club.claimExisting}
        onCreate={(profile, inviteCode) => {
          setJustJoined(true);
          club.createProfile(profile, inviteCode);
        }}
        email={club.usesAccounts ? club.email : null}
        onSignOut={club.usesAccounts ? club.signOut : undefined}
      />
    );
  } else if (me && asksToAgree(me, club.usesAccounts)) {
    body = <RulesAgreementScreen firstName={me.name.split(' ')[0]} onAgree={club.agreeToRules} />;
  } else {
    body = (
      <>
        <Tabs club={club} justJoined={justJoined} />
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
      {club.pendingSaves > 0 && !club.saveProblem && (
        <View style={tabStyles.banner} accessibilityLiveRegion="polite">
          <Text style={tabStyles.bannerTitle}>
            {club.pendingSaves === 1
              ? 'One change is waiting for a connection.'
              : `${club.pendingSaves} changes are waiting for a connection.`}
          </Text>
          <Text style={tabStyles.bannerHint}>
            It's saved on this device and sends by itself when you're back online.
          </Text>
        </View>
      )}
      {club.saveProblem && (
        <Pressable style={tabStyles.banner} onPress={club.dismissSaveProblem}>
          <Text style={tabStyles.bannerTitle}>One more try to {club.saveProblem.action}.</Text>
          <Text style={tabStyles.bannerText}>{club.saveProblem.reason}</Text>
          <Text style={tabStyles.bannerHint}>
            It shows here for now; try again to keep it. Tap to close.
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function App() {
  // Anonymous, and once per arrival: how many invites get opened at all.
  React.useEffect(() => {
    if (inviteCodeFromUrl()) {
      countMilestone('invite-opened');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <Root />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
