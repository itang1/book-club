import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BookCard } from './src/components/BookCard';
import { mockBooks } from './src/data/mockData';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerWrap}>
          <Text style={styles.eyebrow}>Book Club</Text>
          <Text style={styles.title}>The traveling copy</Text>
          <Text style={styles.subtitle}>
            One book, multiple friends, one shared reading journey.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>In transit</Text>
          <Text style={styles.sectionMeta}>{mockBooks.length} active books</Text>
        </View>

        {mockBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f1ea',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  headerWrap: {
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#7a5c48',
    fontWeight: '700',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f1a17',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#54473f',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1a17',
  },
  sectionMeta: {
    fontSize: 12,
    color: '#7a5c48',
    fontWeight: '600',
  },
});
