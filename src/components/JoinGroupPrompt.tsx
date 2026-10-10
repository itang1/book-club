import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Group } from '../types';
import { theme } from '../theme';
import { groupPreview } from '../lib/bookClubService';
import { clearInviteFromUrl, inviteCodeFromUrl } from '../lib/invite';

type JoinGroupPromptProps = {
  groups: Group[];
  currentUserId: string | null;
  onJoin: (inviteCode: string) => void;
};

export function JoinGroupPrompt({ groups, currentUserId, onJoin }: JoinGroupPromptProps) {
  const [invite, setInvite] = useState<{ code: string; id: string; name: string } | null>(null);

  useEffect(() => {
    const code = inviteCodeFromUrl();
    if (!code) {
      return;
    }

    groupPreview(code).then((group) => {
      const alreadyIn = groups.some(
        (candidate) => candidate.id === group?.id && currentUserId && candidate.memberIds.includes(currentUserId),
      );
      if (group && !alreadyIn) {
        setInvite({ code, id: group.id, name: group.name });
      } else {
        clearInviteFromUrl();
      }
    });
    // Only on arrival: the link is answered once.
  }, []);

  const close = () => {
    clearInviteFromUrl();
    setInvite(null);
  };

  return (
    <Modal visible={invite !== null} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Join {invite?.name}?</Text>
          <Text style={styles.body}>
            Members see each other's books and can join their lines. You can leave any
            time.
          </Text>
          <Pressable
            style={styles.join}
            onPress={() => {
              if (invite) {
                onJoin(invite.code);
              }
              close();
            }}
          >
            <Text style={styles.joinText}>Join</Text>
          </Pressable>
          <Pressable style={styles.notNow} onPress={close}>
            <Text style={styles.notNowText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 26, 23, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 22,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.muted,
    marginBottom: 18,
  },
  join: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  joinText: {
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 15,
  },
  notNow: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  notNowText: {
    color: theme.colors.muted,
    fontWeight: '700',
    fontSize: 14,
  },
});
