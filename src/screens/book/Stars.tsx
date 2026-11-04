import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
import { styles } from './styles';

/** Whole stars, 1–5. Read-only unless `onChange` is given; tap a star again to clear. */
export function Stars({
  value,
  size,
  onChange,
}: {
  value?: number;
  size: number;
  onChange?: (value: number | undefined) => void;
}) {
  return (
    <View style={styles.stars} accessibilityLabel={value ? `${value} of 5 stars` : 'Unrated'}>
      {[1, 2, 3, 4, 5].map((star) => {
        const icon = (
          <Ionicons
            name={value !== undefined && star <= value ? 'star' : 'star-outline'}
            size={size}
            color={theme.colors.accent}
          />
        );

        return onChange ? (
          <Pressable
            key={star}
            onPress={() => onChange(star === value ? undefined : star)}
            hitSlop={4}
            style={styles.starButton}
            accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
          >
            {icon}
          </Pressable>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}
