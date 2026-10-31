import { Image, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';

/**
 * A copy drawn as a book: cloth board, the hinge where the spine bends, and a
 * blind-stamped frame with the title set inside it. With a cover photo, the
 * photo replaces the board and keeps the hinge.
 */
export function BookCover({
  title,
  author,
  color,
  imageUrl,
  width,
}: {
  title: string;
  author?: string;
  color: string;
  imageUrl?: string | null;
  width: number;
}) {
  const height = Math.round(width * 1.42);
  const hinge = Math.max(4, Math.round(width * 0.075));
  const inset = Math.max(4, Math.round(width * 0.06));
  // Small enough that a long word ("Persuasion") fits the frame unbroken.
  const titleSize = Math.max(8, Math.round(width / 8.6));

  return (
    <View style={[styles.board, { width, height, backgroundColor: color }]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View
          style={[
            styles.frame,
            { top: inset, bottom: inset, left: hinge + inset, right: inset, padding: inset * 0.5 },
          ]}
        >
          <Text
            style={[styles.title, { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.2) }]}
            numberOfLines={5}
          >
            {title}
          </Text>
          {author && width >= 70 ? (
            <Text style={[styles.author, { fontSize: Math.max(8, titleSize * 0.62) }]} numberOfLines={2}>
              {author}
            </Text>
          ) : null}
        </View>
      )}
      <View style={[styles.hinge, { width: hinge }]} />
      <View style={[styles.hingeLine, { left: hinge }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderTopLeftRadius: 1,
    borderBottomLeftRadius: 1,
    borderTopRightRadius: theme.radius.md,
    borderBottomRightRadius: theme.radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(31, 26, 23, 0.25)',
  },
  hinge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(31, 26, 23, 0.16)',
  },
  hingeLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 253, 251, 0.35)',
  },
  frame: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(31, 26, 23, 0.32)',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.colors.coverInk,
    fontFamily: theme.fonts.serif,
    fontWeight: '700',
    textAlign: 'center',
  },
  author: {
    color: theme.colors.coverInk,
    ...theme.caps,
    textAlign: 'center',
    opacity: 0.85,
  },
});
