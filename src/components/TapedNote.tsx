import { Linking, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';
import { pantsCredit, pantsRules } from '../content/about';

/**
 * The Rules of the Pants as a page torn from a notebook and taped in beside
 * ours: tilted, two strips of tape across the top corners, handwritten.
 * Paraphrased (see content/about), with the credit underneath.
 */
export function TapedNote() {
  return (
    <View style={styles.wrap}>
      <View style={styles.paper}>
        <View style={[styles.tape, styles.tapeLeft]} />
        <View style={[styles.tape, styles.tapeRight]} />

        <Text style={styles.title}>The Rules of the Pants</Text>
        {pantsRules.map((rule, index) => (
          <View key={rule} style={styles.ruleRow}>
            <Text style={[styles.rule, styles.number]}>{index + 1}.</Text>
            <Text style={[styles.rule, styles.ruleText]}>{rule}</Text>
          </View>
        ))}
      </View>
      <Text
        style={styles.credit}
        onPress={() => Linking.openURL(pantsCredit.href)}
        accessibilityRole="link"
      >
        {pantsCredit.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 28,
  },
  paper: {
    width: '88%',
    maxWidth: 380,
    // Notebook paper: warmer than the cards, with a faint shadow so it
    // sits on top of the page rather than in it.
    backgroundColor: '#fdf8ec',
    paddingTop: 26,
    paddingBottom: 20,
    paddingHorizontal: 22,
    transform: [{ rotate: '-2.5deg' }],
    shadowColor: theme.colors.text,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  // Translucent strips, like matte tape, angled across each top corner.
  tape: {
    position: 'absolute',
    top: -8,
    width: 64,
    height: 20,
    backgroundColor: 'rgba(214, 196, 160, 0.55)',
  },
  tapeLeft: {
    left: -16,
    transform: [{ rotate: '-38deg' }],
  },
  tapeRight: {
    right: -16,
    transform: [{ rotate: '38deg' }],
  },
  title: {
    fontFamily: theme.fonts.hand,
    fontSize: 20,
    color: theme.colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  ruleRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  rule: {
    fontFamily: theme.fonts.hand,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
  },
  // Its own column, so wrapped lines hang under the text, not the number.
  number: {
    width: 24,
  },
  ruleText: {
    flex: 1,
  },
  credit: {
    fontSize: 11,
    color: theme.colors.muted,
    textDecorationLine: 'underline',
    marginTop: 14,
    textAlign: 'center',
  },
});
