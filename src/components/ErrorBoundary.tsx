// src/components/ErrorBoundary.tsx
// Catches any render/JS crash and shows the actual error on-screen instead
// of the app silently closing. This is the only way to see what's actually
// failing since we have no logcat access during iPad-only development.

import React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  info: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, info: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ info: info.componentStack || "" });
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>App crashed — here's why:</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.errorText}>{this.state.error.toString()}</Text>
            <Text style={styles.stackText}>{this.state.info}</Text>
          </ScrollView>
          <Pressable style={styles.btn} onPress={() => this.setState({ error: null, info: "" })}>
            <Text style={styles.btnText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 24, paddingTop: 64 },
  title: { color: "#ff5555", fontSize: 18, fontWeight: "700", marginBottom: 16 },
  scroll: { flex: 1, backgroundColor: "#161616", borderRadius: 12, padding: 12 },
  errorText: { color: "#fff", fontSize: 14, fontFamily: "monospace", marginBottom: 12 },
  stackText: { color: "#888", fontSize: 11, fontFamily: "monospace" },
  btn: { backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 16 },
  btnText: { color: "#000", fontWeight: "700" },
});