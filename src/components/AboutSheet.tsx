import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme';
import { TapedNote } from './TapedNote';
import {
  authorName,
  bio,
  homage,
  noteTitle,
  photo,
  photoCaption,
  photoCredit,
  rules,
} from '../content/about';

type AboutSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function AboutSheet({ visible, onClose }: AboutSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.topBarTitle}>Rules & About</Text>
          <Pressable
            style={styles.done}
            onPress={onClose}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <AboutContent />
        </ScrollView>
      </View>
    </Modal>
  );
}

export const SIDE_BY_SIDE_MIN_WIDTH = 900;

/** The page's width when the note sits beside it, so headings above can line up. */
export const SIDE_BY_SIDE_WIDTH = 560 + 40 + 360;

export function AboutContent() {
  const { width } = useWindowDimensions();
  const sideBySide = width >= SIDE_BY_SIDE_MIN_WIDTH;

  const rulesOfTheBooks = (
    <>
        <Text style={styles.heading}>The Rules of the Books</Text>
        <View style={styles.card}>
          {rules.map((rule, index) => (
            <View key={rule} style={[styles.rule, index > 0 && styles.ruleDivider]}>
              <Text style={styles.ruleNumber}>{index + 1}</Text>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>
    </>
  );
  const about = (
    <>
        <Text style={styles.heading}>{noteTitle}</Text>
        <View style={styles.card}>
          <View style={styles.polaroid}>
            {photo ? (
              <Image source={photo} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={styles.exLibris}>Ex Libris</Text>
                <Text style={styles.exLibrisName}>{authorName}</Text>
              </View>
            )}
            <Text style={styles.caption}>{photoCaption}</Text>
            {photo && <Text style={styles.credit}>{photoCredit}</Text>}
          </View>

          {bio.map((paragraph, index) => (
            <Text key={index} style={styles.bio}>
              {paragraph.map((run, runIndex) =>
                typeof run === 'string' ? (
                  run
                ) : (
                  <Text
                    key={runIndex}
                    style={[run.italic && styles.italic, run.href && styles.link]}
                    onPress={run.href ? () => Linking.openURL(run.href as string) : undefined}
                    accessibilityRole={run.href ? 'link' : undefined}
                  >
                    {run.text}
                  </Text>
                ),
              )}
            </Text>
          ))}
          <Text style={styles.signature}>— {authorName}</Text>
        </View>
    </>
  );

  if (!sideBySide) {
    return (
      <View style={styles.column}>
        {rulesOfTheBooks}
        <TapedNote />
        {about}
        <Text style={styles.homage}>{homage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wideColumn}>
      <View style={styles.sideBySide}>
        <View style={styles.mainColumn}>
          {rulesOfTheBooks}
          {about}
        </View>
        <View style={styles.sideColumn}>
          <TapedNote beside />
        </View>
      </View>
      <Text style={styles.homage}>{homage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  done: {
    position: 'absolute',
    right: 20,
    bottom: 12,
  },
  doneText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  column: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  wideColumn: {
    width: '100%',
    maxWidth: SIDE_BY_SIDE_WIDTH,
    alignSelf: 'center',
  },
  sideBySide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainColumn: {
    flex: 1,
    maxWidth: 560,
  },
  sideColumn: {
    width: 360,
    marginLeft: 40,
  },
  heading: {
    fontFamily: theme.fonts.serif,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 28,
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 12,
  },
  ruleDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  ruleNumber: {
    fontFamily: theme.fonts.serif,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.accent,
    width: 28,
  },
  ruleText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 23,
    color: theme.colors.text,
  },
  polaroid: {
    alignSelf: 'center',
    backgroundColor: theme.colors.card,
    padding: 10,
    paddingBottom: 12,
    borderRadius: 3,
    marginTop: 16,
    marginBottom: 20,
    transform: [{ rotate: '-2deg' }],
    shadowColor: theme.colors.text,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  photo: {
    width: 180,
    height: 207,
  },
  photoPlaceholder: {
    backgroundColor: theme.colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 8,
  },
  credit: {
    fontSize: 10,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  bio: {
    fontSize: 16,
    lineHeight: 25,
    color: theme.colors.text,
    marginBottom: 14,
  },
  italic: {
    fontStyle: 'italic',
  },
  link: {
    color: theme.colors.accent,
    textDecorationLine: 'underline',
  },
  signature: {
    fontFamily: theme.fonts.serif,
    fontStyle: 'italic',
    fontSize: 17,
    color: theme.colors.muted,
    marginBottom: 12,
  },
  homage: {
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.muted,
    marginTop: 28,
    textAlign: 'center',
  },
});
