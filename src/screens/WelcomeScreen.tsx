import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Friend } from '../types';
import { theme } from '../theme';
import { tagline } from '../content/about';
import { inviteCodeFromUrl } from '../lib/invite';
import { groupPreview, unclaimedInGroup } from '../lib/bookClubService';
import type { NewProfile } from '../lib/useBookClub';

type ClaimableProfile = Pick<Friend, 'id' | 'name' | 'city'>;

type WelcomeScreenProps = {
  /**
   * Demo data only: everyone, to become. With real accounts the list comes
   * from the invite link instead (who in that group hasn't signed in yet).
   */
  demoMembers?: Friend[];
  onClaim: (personId: string, inviteCode: string | null) => void;
  onCreate: (profile: NewProfile, inviteCode: string | null) => void;
  /** The signed-in email, with real accounts. */
  email?: string | null;
  onSignOut?: () => void;
};

/**
 * First time in: either you're already in the club (tap "That's me") or
 * you're new (make your profile). The first choice comes first, so a friend
 * who's already there finds themselves before reaching the form.
 */
export function WelcomeScreen({
  demoMembers,
  onClaim,
  onCreate,
  email,
  onSignOut,
}: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');

  const inviteCode = inviteCodeFromUrl();
  const [groupName, setGroupName] = useState<string | null>(null);
  const [invited, setInvited] = useState<ClaimableProfile[]>([]);

  // An invite link names its group and lists who in it hasn't signed in yet.
  useEffect(() => {
    if (!inviteCode) {
      return;
    }
    groupPreview(inviteCode).then((group) => setGroupName(group?.name ?? null));
    unclaimedInGroup(inviteCode).then(setInvited);
  }, [inviteCode]);

  const claimable: ClaimableProfile[] = demoMembers ?? invited;
  const ready = Boolean(name.trim() && city.trim());

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Sisterhood of the Traveling Books</Text>
      <Text style={styles.subtitle}>
        {groupName ? `You're invited to ${groupName}. ${tagline}` : tagline}
      </Text>

      {claimable.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Already in {groupName ?? 'the club'}?</Text>
          <Text style={styles.note}>Find yourself and pick up where your friends left off.</Text>
          {claimable.map((person) => (
            <View key={person.id} style={styles.personRow}>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{person.name}</Text>
                <Text style={styles.personCity}>{person.city}</Text>
              </View>
              <Pressable
                style={styles.claimButton}
                onPress={() => onClaim(person.id, inviteCode)}
              >
                <Text style={styles.claimButtonText}>That's me</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {claimable.length > 0 ? 'New here? Join the Sisterhood' : 'Join the Sisterhood'}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={theme.colors.faint}
          style={styles.input}
        />
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="City"
          placeholderTextColor={theme.colors.faint}
          style={styles.input}
        />
        {/* Free text, not a two-letter code: the club isn't all in the US. */}
        <TextInput
          value={region}
          onChangeText={setRegion}
          placeholder="State or country (optional)"
          placeholderTextColor={theme.colors.faint}
          style={styles.input}
        />
        <Text style={styles.note}>
          Friends see your city so they know where their book has been.
        </Text>

        <Pressable
          style={[styles.primaryButton, !ready && styles.disabled]}
          disabled={!ready}
          onPress={() => onCreate({ name, city, region }, inviteCode)}
        >
          <Text style={styles.primaryButtonText}>Join</Text>
        </Pressable>
      </View>

      {email && onSignOut && (
        <Pressable style={styles.footerLink} onPress={onSignOut}>
          <Text style={styles.muted}>
            Signed in as {email}. <Text style={styles.link}>Someone else? Sign out</Text>
          </Text>
        </Pressable>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.muted,
    marginBottom: 24,
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
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  note: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
    marginBottom: 8,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  personCity: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 1,
  },
  claimButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  claimButtonText: {
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 13,
  },
  input: {
    backgroundColor: theme.colors.soft,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 15,
  },
  footerLink: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 6,
  },
  muted: {
    fontSize: 13,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  link: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});
