import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Group } from '../types';
import { theme } from '../theme';
import { inviteLink } from '../lib/invite';

/**
 * Opens the share sheet with the group's invite link. On web without the
 * Share API (most desktop browsers), the link is shown to copy instead.
 */
export function InviteButton({ group }: { group: Group }) {
  const [shownLink, setShownLink] = useState<string | null>(null);

  if (!group.inviteCode) {
    return <Text style={styles.muted}>The invite link appears in a moment.</Text>;
  }

  const link = inviteLink(group.inviteCode);
  const invite = async () => {
    try {
      await Share.share({
        message: `Join ${group.name} on Sisterhood of the Traveling Books: ${link}`,
      });
    } catch {
      setShownLink(link);
    }
  };

  return (
    <View>
      <Pressable style={styles.inviteButton} onPress={invite}>
        <Ionicons name="person-add-outline" size={15} color={theme.colors.onAccent} />
        <Text style={styles.inviteButtonText}>Invite to {group.name}</Text>
      </Pressable>
      {shownLink && (
        <View style={styles.linkBox}>
          <Text style={styles.linkLabel}>Send them this link:</Text>
          <Text style={styles.linkText} selectable>
            {shownLink}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  muted: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  inviteButtonText: {
    marginLeft: 6,
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 14,
  },
  linkBox: {
    marginTop: 10,
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    padding: 10,
  },
  linkLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 4,
  },
  linkText: {
    fontSize: 13,
    color: theme.colors.text,
  },
});
