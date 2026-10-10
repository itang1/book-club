import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Book } from '../types';
import { theme } from '../theme';
import { RouteStop, routeOf } from '../lib/stats';

/** There are no coordinates in the data, so this is a route, not a map. */
export function JourneyRoute({ book }: { book: Book }) {
  const stops = routeOf(book);

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {stops.map((stop, index) => (
            <Stop
              key={stop.key}
              stop={stop}
              before={index === 0 ? null : connectionInto(stop)}
              after={index === stops.length - 1 ? null : connectionInto(stops[index + 1])}
            />
          ))}
        </View>
      </ScrollView>
      {stops.filter((stop) => stop.kind !== 'upcoming' && stop.kind !== 'home').length <= 1 && (
        <Text style={styles.note}>Just getting started. The route grows with every handoff.</Text>
      )}
    </View>
  );
}

type Connection = 'travelled' | 'planned';

function connectionInto(to: RouteStop): Connection {
  return to.kind === 'past' || to.kind === 'current' ? 'travelled' : 'planned';
}

function Segment({ kind }: { kind: Connection | null }) {
  if (!kind) {
    return <View style={styles.segment} />;
  }

  if (kind === 'travelled') {
    return <View style={[styles.segment, styles.travelled]} />;
  }

  // Dotted, drawn as small dots: a dashed border on one side renders
  // unreliably across platforms.
  return (
    <View style={[styles.segment, styles.planned]}>
      {[0, 1, 2, 3].map((dot) => (
        <View key={dot} style={styles.plannedDot} />
      ))}
    </View>
  );
}

function Stop({
  stop,
  before,
  after,
}: {
  stop: RouteStop;
  before: Connection | null;
  after: Connection | null;
}) {
  const meta = {
    past: stop.days === null ? '' : `${stop.days} ${stop.days === 1 ? 'day' : 'days'}`,
    current: `has it · ${stop.days ?? 0}d`,
    arriving: 'on its way',
    upcoming: 'waiting',
    home: 'then home',
  }[stop.kind];

  return (
    <View
      style={styles.stop}
      accessible
      accessibilityLabel={`${stop.name}, ${stop.city}${meta ? `, ${meta}` : ''}`}
    >
      <View style={styles.track}>
        <Segment kind={before} />
        {stop.kind === 'home' ? (
          <View style={[styles.dot, styles.dotHollow, styles.dotHome]}>
            <Ionicons name="home" size={10} color={theme.colors.accent} />
          </View>
        ) : (
          <View
            style={[
              styles.dot,
              stop.kind === 'past' && styles.dotPast,
              stop.kind === 'current' && styles.dotCurrent,
              stop.kind === 'upcoming' && styles.dotHollow,
              stop.kind === 'arriving' && styles.dotArriving,
            ]}
          />
        )}
        <Segment kind={after} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {stop.name}
      </Text>
      <Text style={styles.city} numberOfLines={1}>
        {stop.city}
      </Text>
      {meta ? (
        <Text style={[styles.meta, stop.kind === 'current' && styles.metaCurrent]}>{meta}</Text>
      ) : null}
    </View>
  );
}

const STOP_WIDTH = 92;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  stop: {
    width: STOP_WIDTH,
    alignItems: 'center',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    alignSelf: 'stretch',
  },
  segment: {
    flex: 1,
    height: 2,
  },
  travelled: {
    backgroundColor: theme.colors.accent,
  },
  planned: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  plannedDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.faint,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  dotPast: {
    backgroundColor: theme.colors.accent,
  },
  dotCurrent: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.stamp,
  },
  dotArriving: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.accent,
  },
  dotHollow: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.faint,
  },
  dotHome: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: theme.colors.accent,
  },
  name: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  city: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 1,
  },
  meta: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 3,
  },
  metaCurrent: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  note: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 10,
  },
});
