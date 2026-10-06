import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export function AddBookScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a book</Text>
      <Text style={styles.subtitle}>Start a new traveling copy.</Text>

      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>Title</Text>
        <Text style={styles.placeholder}>The Secret Life of Bees</Text>

        <Text style={styles.fieldLabel}>Author</Text>
        <Text style={styles.placeholder}>Sue Monk Kidd</Text>

        <Text style={styles.fieldLabel}>Next reader</Text>
        <Text style={styles.placeholder}>Leah — Austin, TX</Text>

        <Text style={styles.fieldLabel}>Tracking number</Text>
        <Text style={styles.placeholder}>9400 1234 5678 9012 3456 78</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    marginBottom: 18,
  },
  formCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
  },
  fieldLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  placeholder: {
    backgroundColor: theme.colors.soft,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
