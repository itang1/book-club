import { StyleSheet, Switch, Text, View } from 'react-native';

import { EmailPrefs } from '../types';
import { theme } from '../theme';

type EmailSettingsProps = {
  prefs: EmailPrefs;
  onChange: (prefs: EmailPrefs) => void;
};

const OPTIONS: { key: keyof EmailPrefs; label: string; detail: string }[] = [
  { key: 'bookSent', label: 'A book is on its way to you', detail: 'When someone sends you a copy.' },
  { key: 'bookArrived', label: 'A book you sent arrived', detail: 'When they tap Got it.' },
  { key: 'nextInLine', label: "You're next in line", detail: 'When the person before you gets it.' },
  { key: 'friendRequest', label: 'Friend requests', detail: 'When someone asks to be friends.' },
];

/** Which emails you get, one switch each. All on unless you turn one off. */
export function EmailSettings({ prefs, onChange }: EmailSettingsProps) {
  return (
    <View>
      {OPTIONS.map((option, index) => (
        <View key={option.key} style={[styles.row, index > 0 && styles.divider]}>
          <View style={styles.text}>
            <Text style={styles.label}>{option.label}</Text>
            <Text style={styles.detail}>{option.detail}</Text>
          </View>
          <Switch
            value={prefs[option.key]}
            onValueChange={(value) => onChange({ ...prefs, [option.key]: value })}
            trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
            thumbColor={theme.colors.card}
            accessibilityLabel={option.label}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  text: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  detail: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
});
