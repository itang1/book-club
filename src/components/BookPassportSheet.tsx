import React from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book } from '../types';
import { theme } from '../theme';
import { bookLink } from '../lib/links';
import { copyOwnerId } from '../lib/bookState';

type BookPassportSheetProps = {
  visible: boolean;
  onClose: () => void;
  book: Book;
  groupName?: string;
  ownerName?: string;
};

export function BookPassportSheet({
  visible,
  onClose,
  book,
  groupName,
  ownerName,
}: BookPassportSheetProps) {
  const url = bookLink(book.id);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=6&data=${encodeURIComponent(url)}`;
  const ownerLabel = ownerName ?? 'its owner';

  const handlePrintOrShare = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.print) {
      window.print();
      return;
    }
    try {
      await Share.share({
        title: `${book.title} · Passport`,
        message: `Follow ${book.title}'s journey around our club: ${url}`,
        url,
      });
    } catch {
      // User dismissed share.
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="bookmark-outline" size={20} color={theme.colors.accent} />
              <Text style={styles.headerTitle}>Printable Passport</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close passport">
              <Ionicons name="close" size={22} color={theme.colors.faint} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.leadText}>
              Print and tape this bookplate into the front cover of your copy. Every reader
              can scan the code to log their turn and read letters from the trail.
            </Text>

            {/* The Bookplate printable area */}
            <View style={styles.passportCard} nativeID="printable-bookplate">
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>THE TRAVELING BOOKS</Text>
                {groupName ? <Text style={styles.cardGroup}>{groupName}</Text> : null}
              </View>

              <View style={styles.divider} />

              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.bookAuthor}>by {book.author}</Text>
                <Text style={styles.bookOrigin}>Copy started with {ownerLabel}</Text>
              </View>

              <View style={styles.qrContainer}>
                <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
                <Text style={styles.qrCaption}>
                  Scan with your phone camera to view this copy's journey & letters
                </Text>
              </View>

              <View style={styles.ruleBox}>
                <Text style={styles.ruleQuote}>"Read it, write in it, and pass it on."</Text>
              </View>

              <View style={styles.ledger}>
                <View style={styles.ledgerHeaderRow}>
                  <Text style={[styles.ledgerColHeader, { flex: 2 }]}>DATE</Text>
                  <Text style={[styles.ledgerColHeader, { flex: 3 }]}>READER</Text>
                  <Text style={[styles.ledgerColHeader, { flex: 3 }]}>CITY</Text>
                </View>
                {[0, 1, 2, 3, 4].map((row) => (
                  <View key={row} style={styles.ledgerRow}>
                    <View style={[styles.ledgerCell, { flex: 2 }]} />
                    <View style={[styles.ledgerCell, { flex: 3 }]} />
                    <View style={[styles.ledgerCell, { flex: 3 }]} />
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.printButton} onPress={handlePrintOrShare}>
              <Ionicons
                name={Platform.OS === 'web' ? 'print-outline' : 'share-outline'}
                size={18}
                color={theme.colors.onAccent}
              />
              <Text style={styles.printButtonText}>
                {Platform.OS === 'web' ? 'Print bookplate' : 'Share bookplate'}
              </Text>
            </Pressable>

            <Pressable style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 26, 23, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '92%',
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  leadText: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  passportCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fffcf7',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.accent,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontFamily: theme.fonts.serif,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.accent,
    letterSpacing: 1.2,
  },
  cardGroup: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 10,
  },
  bookInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  bookTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  bookAuthor: {
    fontSize: 14,
    fontStyle: 'italic',
    color: theme.colors.muted,
    marginTop: 2,
  },
  bookOrigin: {
    fontSize: 12,
    color: theme.colors.faint,
    marginTop: 4,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginVertical: 8,
  },
  qrImage: {
    width: 150,
    height: 150,
  },
  qrCaption: {
    fontSize: 11,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 200,
    lineHeight: 14,
  },
  ruleBox: {
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.soft,
    borderRadius: 8,
  },
  ruleQuote: {
    fontFamily: theme.fonts.hand,
    fontSize: 14,
    color: theme.colors.accent,
    textAlign: 'center',
  },
  ledger: {
    width: '100%',
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.soft,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  ledgerColHeader: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  ledgerRow: {
    flexDirection: 'row',
    height: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  ledgerCell: {
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  printButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  printButtonText: {
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 14,
  },
  doneButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: theme.colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
});
