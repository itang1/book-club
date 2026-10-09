import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Friend } from '../types';
import { theme } from '../theme';
import { invitedByFromUrl } from '../lib/invite';
import type { NewProfile } from '../lib/useBookClub';

type WelcomeScreenProps = {
  members: Friend[];
  onCreate: (profile: NewProfile, invitedBy: string | null) => void;
  onPick: (personId: string) => void;
};

/**
 * First launch on a device: make your own profile. Nobody else adds you;
 * you join, ideally from a friend's invite link.
 *
 * Until there's real sign-in, an existing member on a new device picks
 * themselves from the list below the form. That's honest about what it is:
 * a stand-in, not security.
 */
export function WelcomeScreen({ members, onCreate, onPick }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [showMembers, setShowMembers] = useState(false);

  const invitedBy = invitedByFromUrl();
  const inviter = members.find((person) => person.id === invitedBy);
  const ready = Boolean(name.trim() && city.trim());

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Sisterhood of the Traveling Books</Text>
      <Text style={styles.subtitle}>
        {inviter
          ? `${inviter.name.split(' ')[0]} invited you. One copy, passed between friends, and every place it's been.`
          : "One copy, passed between friends, and every place it's been."}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Join the club</Text>
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
          onPress={() => onCreate({ name, city, region }, invitedBy)}
        >
          <Text style={styles.primaryButtonText}>Join</Text>
        </Pressable>
      </View>

      {members.length > 0 && (
        <View style={styles.existing}>
          <Pressable onPress={() => setShowMembers((open) => !open)}>
            <Text style={styles.link}>
              {showMembers ? 'Hide' : 'Already in the club? Find yourself'}
            </Text>
          </Pressable>
          {showMembers && (
            <View style={styles.chipRow}>
              {members.map((person) => (
                <Pressable key={person.id} style={styles.chip} onPress={() => onPick(person.id)}>
                  <Text style={styles.chipText}>{person.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
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
  },
  cardTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
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
  note: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
    marginBottom: 6,
  },
  primaryButton: {
    marginTop: 10,
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
  existing: {
    marginTop: 24,
    alignItems: 'center',
  },
  link: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
  },
  chip: {
    backgroundColor: theme.colors.soft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  chipText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
});
