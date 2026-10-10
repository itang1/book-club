import { Linking, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';
import { pantsCredit, pantsPreamble, pantsRules } from '../content/about';

export function TapedNote({ beside = false }: { beside?: boolean }) {
  return (
    <View style={[styles.wrap, beside && styles.wrapBeside]}>
      <View style={[styles.paper, beside && styles.paperBeside]}>
        <View style={[styles.tape, styles.tapeLeft]} />
        <View style={[styles.tape, styles.tapeRight]} />

        <Text style={styles.title}>The Rules of the Pants</Text>
        <Text style={styles.preamble}>{pantsPreamble}</Text>
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
  wrapBeside: {
    marginTop: 72,
  },
  paperBeside: {
    width: '100%',
  },
  paper: {
    width: '88%',
    maxWidth: 380,
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
  preamble: {
    fontFamily: theme.fonts.hand,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
    marginBottom: 8,
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
