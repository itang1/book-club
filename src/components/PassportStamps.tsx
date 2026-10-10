import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';
import type { PlaceVisit } from '../lib/stats';

export function PassportStamps({ places }: { places: PlaceVisit[] }) {
  if (places.length === 0) {
    return (
      <Text style={styles.empty}>
        Lend a book and its stamps collect here, one for every place it visits.
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      {places.map((place, index) => (
        <View
          key={`${place.city}|${place.region}`}
          style={[styles.stamp, { transform: [{ rotate: `${TILTS[index % TILTS.length]}deg` }] }]}
        >
          <Text style={styles.city} numberOfLines={2}>
            {place.city}
          </Text>
          <Text style={styles.region}>
            {place.region}
            {place.visits > 1 ? ` · ×${place.visits}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

const TILTS = [-3, 2, -1, 3, -2];

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  stamp: {
    borderWidth: 2,
    borderColor: theme.colors.stamp,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 5,
    alignItems: 'center',
    maxWidth: 170,
  },
  city: {
    fontFamily: theme.fonts.serif,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  region: {
    fontSize: 10,
    color: theme.colors.muted,
    marginTop: 1,
    letterSpacing: 0.4,
  },
  empty: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
