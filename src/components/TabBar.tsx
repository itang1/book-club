import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme';

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; idle: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'book', idle: 'book-outline' },
  Friends: { active: 'people', idle: 'people-outline' },
  Profile: { active: 'person', idle: 'person-outline' },
};

/**
 * The bottom tabs, drawn by hand so the current one can't be missed. It's
 * marked three ways at once, so no single cue has to carry it: a tinted panel
 * behind it, a filled icon in an accent pill, and a bold dark label. The others stay quiet: outline icons,
 * muted labels, no panel.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const icons = ICONS[route.name] ?? { active: 'ellipse', idle: 'ellipse-outline' };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[styles.item, focused && styles.itemActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
          >
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? icons.active : icons.idle}
                size={20}
                color={focused ? theme.colors.onAccent : theme.colors.faint}
              />
            </View>
            <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
    marginHorizontal: 4,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  itemActive: {
    backgroundColor: theme.colors.soft,
  },
  iconWrap: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconWrapActive: {
    backgroundColor: theme.colors.accent,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  labelActive: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text,
  },
});
