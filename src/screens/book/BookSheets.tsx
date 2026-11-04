import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

import { Book, Letter } from '../../types';
import { theme } from '../../theme';
import { friendNameIn } from '../../lib/bookState';
import { Stars } from './Stars';
import { styles } from './styles';

// Custom modals rather than Alert.alert, which react-native-web does not
// implement reliably.

/**
 * Passing the book on, with the note and stars. Open while `to` is set; the
 * note starts fresh each time.
 */
export function PassOnSheet({
  book,
  to,
  goingHome,
  onConfirm,
  onClose,
}: {
  book: Book;
  to: string | null;
  goingHome: boolean;
  onConfirm: (to: string, letter: Letter) => void;
  onClose: () => void;
}) {
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [note, setNote] = useState('');
  const closeSheet = () => {
    setRating(undefined);
    setNote('');
    onClose();
  };

  return (
    <Modal visible={to !== null} transparent animationType="fade" onRequestClose={closeSheet}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>
            {goingHome ? 'Send it home?' : 'Send it on its way?'}
          </Text>
          <Text style={styles.sheetBody}>
            Tap this once it's in the post. {friendNameIn(book, to).split(' ')[0]} taps Got it when
            it arrives. The leg goes into the travel history for good.
          </Text>

          {/* The in-app note and stars are about the book. The handwritten
            letter travels in the package and never touches the app. Readers
            who come after see the note only once they've finished too. */}
          <Text style={styles.sheetLabel}>Rate it and leave a note about the book</Text>
          <Stars value={rating} size={28} onChange={setRating} />
          <TextInput
            accessibilityLabel="Your letter to the next reader"
            value={note}
            onChangeText={setNote}
            placeholder={`Dear ${friendNameIn(book, to).split(' ')[0]}, …`}
            placeholderTextColor={theme.colors.faint}
            multiline
            maxLength={500}
            style={styles.sheetInput}
          />
          <Text style={styles.sheetBody}>
            Your handwritten letter doesn't go here. Tuck it in the package with the book. It can be
            about anything.
          </Text>

          <Pressable
            style={styles.sheetConfirm}
            onPress={() => {
              if (to) {
                onConfirm(to, { note, rating });
              }
              closeSheet();
            }}
          >
            <Text style={styles.sheetConfirmText}>
              Yes, {goingHome ? 'return' : 'pass'} to {friendNameIn(book, to)}
            </Text>
          </Pressable>

          <Pressable style={styles.sheetCancel} onPress={closeSheet}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** Fix a typo in the title or author (the owner only). Mounted fresh each time it opens. */
export function EditDetailsSheet({
  book,
  visible,
  onSave,
  onClose,
}: {
  book: Book;
  visible: boolean;
  onSave: (title: string, author: string) => void;
  onClose: () => void;
}) {
  const [editTitle, setEditTitle] = useState(book.title);
  const [editAuthor, setEditAuthor] = useState(book.author);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Edit book details</Text>
          <Text style={styles.sheetBody}>
            Fix typos in the title or author. The changes will show for everyone reading this copy.
          </Text>
          <Text style={styles.sheetLabel}>Title</Text>
          <TextInput
            accessibilityLabel="Title"
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="Title"
            placeholderTextColor={theme.colors.faint}
            style={styles.fieldInput}
          />
          <Text style={styles.sheetLabel}>Author</Text>
          <TextInput
            accessibilityLabel="Author"
            value={editAuthor}
            onChangeText={setEditAuthor}
            placeholder="Author"
            placeholderTextColor={theme.colors.faint}
            style={styles.fieldInput}
          />
          <Pressable
            style={[
              styles.sheetConfirm,
              (!editTitle.trim() || !editAuthor.trim()) && styles.disabled,
            ]}
            disabled={!editTitle.trim() || !editAuthor.trim()}
            onPress={() => {
              if (editTitle.trim() && editAuthor.trim()) {
                onSave(editTitle.trim(), editAuthor.trim());
              }
              onClose();
            }}
            accessibilityRole="button"
          >
            <Text style={styles.sheetConfirmText}>Save changes</Text>
          </Pressable>
          <Pressable style={styles.sheetCancel} onPress={onClose}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** Put the copy to rest at home (the owner only). */
export function RetireSheet({
  visible,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Keep this copy home?</Text>
          <Text style={styles.sheetBody}>
            Put this copy to rest on the home shelf. Its past travels, stamps, and notes stay safe
            to look back on, and the line will rest.
          </Text>
          <Pressable
            style={styles.sheetConfirm}
            onPress={() => {
              onConfirm();
              onClose();
            }}
            accessibilityRole="button"
          >
            <Text style={styles.sheetConfirmText}>Yes, rest this copy</Text>
          </Pressable>
          <Pressable style={styles.sheetCancel} onPress={onClose}>
            <Text style={styles.sheetCancelText}>Keep travelling</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
