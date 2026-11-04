import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';
import { reportError } from '../lib/monitoring';

/**
 * If a screen crashes, show a calm, branded page with a way back instead of
 * a blank screen, and report what happened.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, info.componentStack?.trim().split('\n')[0]);
  }

  private reload = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.setState({ failed: false });
    }
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={styles.page}>
        <Image source={require('../../assets/crest.png')} style={styles.crest} />
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          This page tripped over itself. It's been reported, and your books are safe. Try again, and
          if it keeps happening, reply to any email from the app.
        </Text>
        <Pressable style={styles.button} onPress={this.reload} accessibilityRole="button">
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.letterhead,
    padding: 32,
  },
  crest: { width: 50, height: 60, marginBottom: 18 },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 26,
    color: theme.colors.onMasthead,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    color: theme.colors.onMasthead,
    textAlign: 'center',
    maxWidth: 360,
    marginTop: 10,
  },
  button: {
    backgroundColor: theme.colors.onMasthead,
    borderRadius: theme.radius.sm,
    paddingVertical: 11,
    paddingHorizontal: 20,
    marginTop: 22,
  },
  buttonText: { ...theme.caps, fontSize: 12, fontWeight: '700', color: theme.colors.letterhead },
});
