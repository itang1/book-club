import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { Book } from '../types';

type CoverVariant = 'card' | 'detail' | 'mini';

type ArtisticBookCoverProps = {
  book: Book;
  variant?: CoverVariant;
  /** When true and book has coverUrl, shows the photo. Defaults to false to favor artistic jacket. */
  preferPhoto?: boolean;
};

const ORNAMENTS = ['✦', '❧', '◈', '✤', '❦', '✻', '✧', '❖'];

function pickOrnament(title: string): string {
  let sum = 0;
  for (let i = 0; i < title.length; i += 1) {
    sum += title.charCodeAt(i);
  }
  return ORNAMENTS[sum % ORNAMENTS.length];
}

export function ArtisticBookCover({
  book,
  variant = 'card',
  preferPhoto = false,
}: ArtisticBookCoverProps) {
  const sizeStyle = SIZES[variant];
  const ornament = pickOrnament(book.title);

  if (preferPhoto && book.coverUrl) {
    return (
      <View style={[styles.wrapper, sizeStyle.wrapper, { backgroundColor: book.coverColor }]}>
        <Image
          source={{ uri: book.coverUrl }}
          style={[styles.photo, sizeStyle.wrapper]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.spineShadow} />
      </View>
    );
  }

  return (
    <View style={[styles.jacket, sizeStyle.wrapper, { backgroundColor: book.coverColor }]}>
      {/* Spine crease on left edge */}
      <View style={styles.spineHighlight} />
      <View style={styles.spineCrease} />

      {/* Blind-debossed inner frame */}
      <View style={[styles.innerFrame, sizeStyle.frame]}>
        <View style={styles.ornamentTopWrap}>
          <Text style={[styles.ornament, sizeStyle.ornament]}>{ornament}</Text>
        </View>

        <Text
          style={[styles.title, sizeStyle.title]}
          numberOfLines={variant === 'mini' ? 3 : 4}
        >
          {book.title}
        </Text>

        {variant !== 'mini' && book.author ? (
          <>
            <View style={styles.rule} />
            <Text style={[styles.author, sizeStyle.author]} numberOfLines={2}>
              {book.author}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

const SIZES = {
  mini: {
    wrapper: { width: 44, height: 66, borderRadius: 3 },
    frame: { padding: 4 },
    ornament: { fontSize: 8, marginBottom: 2 },
    title: { fontSize: 8, lineHeight: 10 },
    author: { fontSize: 7, lineHeight: 9 },
  },
  card: {
    wrapper: { width: 76, height: 114, borderRadius: 5 },
    frame: { padding: 7 },
    ornament: { fontSize: 10, marginBottom: 4 },
    title: { fontSize: 11, lineHeight: 14 },
    author: { fontSize: 9, lineHeight: 12 },
  },
  detail: {
    wrapper: { width: 104, height: 156, borderRadius: 6 },
    frame: { padding: 10 },
    ornament: { fontSize: 13, marginBottom: 6 },
    title: { fontSize: 14, lineHeight: 18 },
    author: { fontSize: 11, lineHeight: 15 },
  },
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    position: 'relative',
    shadowColor: theme.colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  spineShadow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  jacket: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(31, 26, 23, 0.14)',
    shadowColor: theme.colors.text,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  spineHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  spineCrease: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 3,
    width: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  innerFrame: {
    flex: 1,
    margin: 3,
    marginLeft: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(31, 26, 23, 0.2)',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  ornamentTopWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ornament: {
    color: 'rgba(31, 26, 23, 0.45)',
    fontWeight: '700',
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontWeight: '700',
    color: theme.colors.coverInk,
    textAlign: 'center',
  },
  rule: {
    width: 20,
    height: 1,
    backgroundColor: 'rgba(31, 26, 23, 0.2)',
    marginVertical: 4,
  },
  author: {
    fontFamily: theme.fonts.serif,
    fontStyle: 'italic',
    color: theme.colors.coverInk,
    opacity: 0.85,
    textAlign: 'center',
  },
});
