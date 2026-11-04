import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme';
import { tagline } from '../content/about';

/**
 * The house letterhead: crest, name, motto and tagline on green, edged in
 * brass. Every first impression opens with it (Home, sign-in, welcome), so
 * the app reads as one place. `children` sit under the tagline.
 */
export function Letterhead({ children, line = tagline }: { children?: ReactNode; line?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 28 }]}>
      <Image
        source={require('../../assets/crest.png')}
        style={styles.crest}
        accessibilityIgnoresInvertColors
      />
      <Text style={styles.title} accessibilityRole="header">
        The Traveling Books
      </Text>
      <View style={styles.ornament}>
        <View style={styles.ornamentRule} />
        <View style={styles.ornamentDiamond} />
        <View style={styles.ornamentRule} />
      </View>
      <Text style={styles.motto}>Lege · Scribe · Trade</Text>
      <Text style={styles.line}>{line}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.letterhead,
    paddingHorizontal: 24,
    paddingBottom: 22,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.brass,
  },
  crest: {
    width: 50,
    height: 60,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: 0.3,
    color: theme.colors.onMasthead,
    textAlign: 'center',
    marginTop: 12,
  },
  ornament: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    width: 180,
  },
  ornamentRule: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.brass,
  },
  ornamentDiamond: {
    width: 6,
    height: 6,
    backgroundColor: theme.colors.brass,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 8,
  },
  motto: {
    ...theme.caps,
    fontSize: 11,
    letterSpacing: 3,
    color: theme.colors.brass,
    marginTop: 10,
  },
  line: {
    fontFamily: theme.fonts.serif,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.onMasthead,
    textAlign: 'center',
    marginTop: 8,
  },
});
