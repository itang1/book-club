import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { EmailPrefs } from '../types';
import { theme } from '../theme';
import {
  getPushNotificationPermission,
  isWebPushSupported,
  requestPushPermission,
} from '../lib/pushNotifications';

type EmailSettingsProps = {
  prefs: EmailPrefs;
  onChange: (prefs: EmailPrefs) => void;
};

const OPTIONS: { key: keyof EmailPrefs; label: string; detail: string }[] = [
  { key: 'newBook', label: 'New books in your groups', detail: 'With a button to join the line.' },
  {
    key: 'bookSent',
    label: 'A book is on its way to you',
    detail: 'When someone sends you a copy.',
  },
  { key: 'bookArrived', label: 'A book you sent arrived', detail: 'When they tap Got it.' },
  {
    key: 'nextInLine',
    label: "You're next in line",
    detail: 'When the person before you gets it.',
  },
  { key: 'friendRequest', label: 'Friend requests', detail: 'When someone asks to be friends.' },
  {
    key: 'reminders',
    label: 'Gentle reminders',
    detail: 'At most one a month: a book to tap Got it on, or one a friend is waiting for.',
  },
];

export function EmailSettings({ prefs, onChange }: EmailSettingsProps) {
  const pushSupported = isWebPushSupported();
  const [webPushGranted, setWebPushGranted] = useState(
    () => pushSupported && getPushNotificationPermission() === 'granted',
  );

  const handleToggleWebPush = async (value: boolean) => {
    if (value) {
      const status = await requestPushPermission();
      setWebPushGranted(status === 'granted');
    } else {
      setWebPushGranted(false);
    }
  };

  const anyOn = OPTIONS.some((option) => prefs[option.key]);
  const setAll = (value: boolean) =>
    onChange(Object.fromEntries(OPTIONS.map((option) => [option.key, value])) as EmailPrefs);

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={styles.allLabel}>All emails</Text>
          <Text style={styles.detail}>
            {anyOn
              ? 'Switch off to pause every email at once.'
              : 'All paused. Switch on to hear about every one.'}
          </Text>
        </View>
        <Switch
          value={anyOn}
          onValueChange={setAll}
          trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
          thumbColor={theme.colors.card}
          accessibilityLabel="All emails"
        />
      </View>
      {OPTIONS.map((option) => (
        <View key={option.key} style={[styles.row, styles.divider]}>
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

      {pushSupported && (
        <View style={[styles.row, styles.divider]}>
          <View style={styles.text}>
            <Text style={styles.label}>Browser notifications</Text>
            <Text style={styles.detail}>
              Hear when a book is sent your way or arrives with a friend directly in your browser.
            </Text>
          </View>
          <Switch
            value={webPushGranted}
            onValueChange={handleToggleWebPush}
            trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
            thumbColor={theme.colors.card}
            accessibilityLabel="Browser notifications"
          />
        </View>
      )}
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
    color: theme.colors.text,
    fontWeight: '600',
  },
  allLabel: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '700',
  },
  detail: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
});
