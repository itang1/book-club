import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme';
import { AboutContent } from '../components/AboutSheet';

type RulesAgreementScreenProps = {
  firstName: string;
  onAgree: () => void;
};

/**
 * Shown once per person, right after they join: the Rules of the Books (and
 * About), with "I agree" pinned at the bottom. Like the Sisterhood settling
 * its rules before the Pants leave, minus the oath. After this, the Rules &
 * about button on Books is the way back.
 */
export function RulesAgreementScreen({ firstName, onAgree }: RulesAgreementScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 28 }]}>
        <View style={styles.intro}>
          <Text style={styles.welcome}>Welcome, {firstName}.</Text>
          <Text style={styles.lede}>
            Before your first book, here are the rules we all go by.
          </Text>
        </View>
        <AboutContent />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Text style={styles.footerNote}>Agreeing means you'll follow the Rules of the Books.</Text>
        <Pressable style={styles.agree} onPress={onAgree} accessibilityRole="button">
          <Text style={styles.agreeText}>I agree</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  intro: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  welcome: {
    fontFamily: theme.fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: theme.colors.text,
  },
  lede: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.muted,
    marginTop: 6,
  },
  // Pinned, so the button is always in reach however far down you've read.
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingTop: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 10,
    textAlign: 'center',
  },
  agree: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  agreeText: {
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 16,
  },
});
