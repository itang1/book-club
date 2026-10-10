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

        const badge = options.tabBarBadge;

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
              {badge !== undefined && (
                <View style={styles.badge}>
                  {typeof badge === 'number' && badge > 0 ? (
                    <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                  ) : null}
                </View>
              )}
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
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.stamp,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: theme.colors.card,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
});
