import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme';
import { authorName, bio, homage, photo, photoCaption, photoCredit, rules } from '../content/about';

type AboutSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/** The Rules of the Books, who made this, and the homage. Content lives in content/about. */
export function AboutSheet({ visible, onClose }: AboutSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      >
        <Pressable style={styles.close} onPress={onClose} accessibilityRole="button">
          <Text style={styles.closeText}>Done</Text>
        </Pressable>

        <Text style={styles.title}>The Rules of the Books</Text>
        <View style={styles.rules}>
          {rules.map((rule, index) => (
            <View key={rule} style={styles.rule}>
              <Text style={styles.ruleNumber}>{index + 1}.</Text>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.heading}>Who made this</Text>
        <View style={styles.polaroid}>
          {photo ? (
            <Image source={photo} style={styles.photo} resizeMode="cover" />
          ) : (
            // A bookplate stands in until there's a photo.
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.exLibris}>Ex Libris</Text>
              <Text style={styles.exLibrisName}>{authorName}</Text>
            </View>
          )}
          <Text style={styles.caption}>{photoCaption}</Text>
          {photo && <Text style={styles.credit}>{photoCredit}</Text>}
        </View>

        {bio.map((paragraph) => (
          <Text key={paragraph} style={styles.bio}>
            {paragraph}
          </Text>
        ))}
        <Text style={styles.signature}>— {authorName}</Text>

        <Text style={styles.homage}>{homage}</Text>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  close: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  closeText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  rules: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 18,
  },
  rule: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  ruleNumber: {
    fontFamily: theme.fonts.serif,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.stamp,
    width: 26,
  },
  ruleText: {
    flex: 1,
    fontFamily: theme.fonts.serif,
    fontSize: 16,
    lineHeight: 23,
    color: theme.colors.text,
  },
  heading: {
    fontFamily: theme.fonts.serif,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 32,
    marginBottom: 16,
  },
  polaroid: {
    alignSelf: 'center',
    backgroundColor: theme.colors.card,
    padding: 12,
    paddingBottom: 16,
    borderRadius: 4,
    marginBottom: 20,
    // A slight tilt, like a photo taped into a notebook.
    transform: [{ rotate: '-2deg' }],
    shadowColor: theme.colors.text,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  photo: {
    width: 200,
    height: 230,
  },
  photoPlaceholder: {
    backgroundColor: theme.colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exLibris: {
    fontFamily: theme.fonts.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: theme.colors.muted,
  },
  exLibrisName: {
    fontFamily: theme.fonts.serif,
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.accent,
    marginTop: 4,
  },
  caption: {
    fontFamily: theme.fonts.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: 10,
  },
  credit: {
    fontSize: 10,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.4,
  },
  bio: {
    fontSize: 16,
    lineHeight: 25,
    color: theme.colors.text,
    marginBottom: 12,
  },
  signature: {
    fontFamily: theme.fonts.serif,
    fontStyle: 'italic',
    fontSize: 16,
    color: theme.colors.muted,
  },
  homage: {
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.muted,
    marginTop: 36,
    textAlign: 'center',
  },
});
