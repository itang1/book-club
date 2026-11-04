import { Text, View } from 'react-native';

import { Book } from '../../types';
import {
  canReadLetter,
  formatDate,
  friendNameIn,
  hasLetter,
  heldForDays,
  isBackHome,
  journey,
  placeOf,
} from '../../lib/bookState';
import { Stars } from './Stars';
import { styles } from './styles';

/** Every leg of the journey, newest first, with its letter (sealed or open). */
export function TravelHistory({
  book,
  currentUserId,
}: {
  book: Book;
  currentUserId: string | null;
}) {
  const legs = journey(book).reverse();

  return (
    <View style={styles.box}>
      <Text style={styles.boxTitle}>Travel history</Text>
      <Text style={styles.boxCaption}>Every leg of the journey, newest first.</Text>
      {legs.length === 0 ? (
        <Text style={styles.legMeta}>This copy's journey starts with its first handoff.</Text>
      ) : (
        legs.map((leg, index) => {
          // `legs` is newest-first, so the held duration comes from the
          // original chronological ordering.
          const held = heldForDays(journey(book), legs.length - 1 - index);
          const place = placeOf(book, leg);

          return (
            <View key={leg.id} style={styles.legItem}>
              <Text style={styles.legRoute}>
                {leg.fromFriend
                  ? `${friendNameIn(book, leg.fromFriend)} → ${friendNameIn(book, leg.toFriend)}`
                  : book.giftedBy
                    ? `A gift from ${book.giftedBy} to ${friendNameIn(book, leg.toFriend)}`
                    : `Entered circulation with ${friendNameIn(book, leg.toFriend)}`}
              </Text>
              <Text style={styles.legMeta}>
                {formatDate(leg.happenedAt)}
                {place ? ` · ${place.city}` : ''}
                {leg.fromFriend && !leg.receivedAt
                  ? ' · in the post'
                  : held !== null
                    ? ` · held ${held} ${held === 1 ? 'day' : 'days'}`
                    : isBackHome(book)
                      ? ' · back home'
                      : ' · still reading'}
              </Text>
              {leg.fromFriend &&
                hasLetter(leg) &&
                (canReadLetter(book, leg, currentUserId) ? (
                  <View style={styles.letter}>
                    {leg.rating ? <Stars value={leg.rating} size={13} /> : null}
                    {leg.note ? <Text style={styles.letterText}>“{leg.note}”</Text> : null}
                    <Text style={styles.letterSign}>— {friendNameIn(book, leg.fromFriend)}</Text>
                  </View>
                ) : (
                  <View style={[styles.letter, styles.letterSealed]}>
                    <Text style={styles.letterSealedText}>
                      ✉ Sealed note from {friendNameIn(book, leg.fromFriend)}. It opens once you've
                      finished the book.
                    </Text>
                  </View>
                ))}
            </View>
          );
        })
      )}
    </View>
  );
}
