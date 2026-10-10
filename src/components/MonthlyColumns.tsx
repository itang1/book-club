import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';
import type { MonthCount } from '../lib/stats';

const PLOT_HEIGHT = 88;

/**
 * Books finished per month, one column each. One series in one hue, so no
 * legend; the card's title names it. Values sit on the caps of non-empty
 * columns only. Tap a column for its month and titles.
 */
export function MonthlyColumns({ data }: { data: MonthCount[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((bucket) => bucket.count));
  const total = data.reduce((sum, bucket) => sum + bucket.count, 0);
  const picked = selected === null ? null : data[selected];

  return (
    <View>
      <Text style={styles.readout}>
        {picked
          ? `${picked.month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} · ${
              picked.count === 0 ? 'between books' : picked.titles.join(', ')
            }`
          : `${total} ${total === 1 ? 'book' : 'books'} finished in the last ${data.length} months`}
      </Text>

      <View style={styles.plot}>
        {data.map((bucket, index) => {
          const height = (bucket.count / max) * (PLOT_HEIGHT - 18);
          const isSelected = index === selected;

          return (
            <Pressable
              key={bucket.month.toISOString()}
              style={styles.slot}
              onPress={() => setSelected(isSelected ? null : index)}
              accessibilityRole="button"
              accessibilityLabel={`${bucket.month.toLocaleDateString(undefined, {
                month: 'long',
              })}: ${bucket.count} finished`}
            >
              {bucket.count > 0 && <Text style={styles.value}>{bucket.count}</Text>}
              {bucket.count > 0 ? (
                <View
                  style={[
                    styles.column,
                    { height },
                    selected !== null && !isSelected && styles.columnMuted,
                  ]}
                />
              ) : (
                // A recessive stub keeps empty months visible as months.
                <View style={styles.stub} />
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.axis}>
        {data.map((bucket) => (
          <Text key={bucket.month.toISOString()} style={styles.tick}>
            {bucket.month.toLocaleDateString(undefined, { month: 'narrow' })}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 12,
    minHeight: 18,
  },
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: PLOT_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  // At most 24px wide with a 4px rounded cap and a square base, growing from
  // the baseline.
  column: {
    width: '62%',
    maxWidth: 24,
    backgroundColor: theme.colors.accent,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  columnMuted: {
    opacity: 0.35,
  },
  stub: {
    width: '62%',
    maxWidth: 24,
    height: 2,
    backgroundColor: theme.colors.border,
  },
  value: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 3,
  },
  axis: {
    flexDirection: 'row',
    marginTop: 6,
  },
  tick: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    color: theme.colors.muted,
  },
});
