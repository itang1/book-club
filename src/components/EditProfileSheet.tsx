import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Friend } from '../types';
import { theme } from '../theme';

type EditProfileSheetProps = {
  me: Friend;
  visible: boolean;
  onClose: () => void;
  onSave: (changes: Pick<Friend, 'name' | 'city' | 'state'>) => void;
};

export function EditProfileSheet({ me, visible, onClose, onSave }: EditProfileSheetProps) {
  const [name, setName] = useState(me.name);
  const [city, setCity] = useState(me.city);
  const [region, setRegion] = useState(me.state === '—' ? '' : me.state);

  useEffect(() => {
    if (visible) {
      setName(me.name);
      setCity(me.city);
      setRegion(me.state === '—' ? '' : me.state);
    }
  }, [visible, me]);

  const ready = Boolean(name.trim() && city.trim());

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Your profile</Text>
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
          <TextInput
            value={region}
            onChangeText={setRegion}
            placeholder="State or country (optional)"
            placeholderTextColor={theme.colors.faint}
            style={styles.input}
          />
          <Text style={styles.note}>
            Moved, or reading somewhere else for a while? Change your city here. Books
            you receive from now on count there; places they've already been stay put.
          </Text>

          <Pressable
            style={[styles.save, !ready && styles.disabled]}
            disabled={!ready}
            onPress={() => {
              onSave({ name: name.trim(), city: city.trim(), state: region.trim() || '—' });
              onClose();
            }}
          >
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
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
    fontSize: 21,
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
    lineHeight: 17,
    color: theme.colors.muted,
    marginTop: 2,
    marginBottom: 14,
  },
  save: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  saveText: {
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 15,
  },
  cancel: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelText: {
    color: theme.colors.muted,
    fontWeight: '700',
    fontSize: 14,
  },
});
