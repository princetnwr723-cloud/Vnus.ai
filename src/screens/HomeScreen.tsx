// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useAppStore } from "../state/useAppStore";
import { NativeAutomation } from "../services/nativeAutomation";
import { runAgentTask } from "../services/agentLoop";
import { disconnectAll } from "../services/secureStorage";

export default function HomeScreen({ navigation }: any) {
  const { connectedProviderId, selectedModel, isAutomationRunning, lastTaskLog, appendLog, setAutomationRunning, disconnect } = useAppStore();
  const [task, setTask] = useState("");
  const [serviceEnabled, setServiceEnabled] = useState(false);

  useEffect(() => {
    NativeAutomation.isServiceEnabled().then(setServiceEnabled);
  }, []);

  const handleEnableService = () => {
    NativeAutomation.openAccessibilitySettings();
  };

  const handleRunTask = async () => {
    if (!task.trim() || !connectedProviderId || !selectedModel) return;
    if (!serviceEnabled) {
      Alert.alert("Enable accessibility first", "Agentic Vnus needs the accessibility permission to control your screen.");
      return;
    }
    setAutomationRunning(true);
    appendLog(`▶ Starting: ${task}`);
    try {
      const summary = await runAgentTask(task, connectedProviderId, selectedModel, (step) => {
        appendLog(`Step ${step.step}: ${step.action} — ${step.reasoning}`);
      });
      appendLog(`✅ Done: ${summary}`);
    } catch (err: any) {
      appendLog(`❌ Error: ${err?.message || "Unknown error"}`);
    } finally {
      setAutomationRunning(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectAll();
    disconnect();
    navigation.replace("Connect");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agentic Vnus</Text>
        <Pressable onPress={handleDisconnect}>
          <Text style={styles.disconnect}>Disconnect</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>{connectedProviderId} · {selectedModel}</Text>

      {!serviceEnabled && (
        <Pressable style={styles.warningBanner} onPress={handleEnableService}>
          <Text style={styles.warningText}>⚠️ Accessibility service not enabled — tap to enable</Text>
        </Pressable>
      )}

      <TextInput
        placeholder="What should the agent do? e.g. Open Settings and check battery level"
        placeholderTextColor="#666"
        value={task}
        onChangeText={setTask}
        multiline
        style={styles.taskInput}
      />

      <Pressable
        style={[styles.runBtn, isAutomationRunning && styles.runBtnDisabled]}
        onPress={handleRunTask}
        disabled={isAutomationRunning}
      >
        <Text style={styles.runBtnText}>{isAutomationRunning ? "Running..." : "Run Task"}</Text>
      </Pressable>

      <Text style={styles.logTitle}>Activity</Text>
      <ScrollView style={styles.logBox}>
        {lastTaskLog.map((line, i) => (
          <Text key={i} style={styles.logLine}>{line}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 24, paddingTop: 64 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },
  disconnect: { color: "#888", fontSize: 13 },
  subtitle: { color: "#666", fontSize: 13, marginTop: 4 },
  warningBanner: { backgroundColor: "#2a1a00", borderColor: "#553300", borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 16 },
  warningText: { color: "#ffb84d", fontSize: 13 },
  taskInput: { backgroundColor: "#161616", borderRadius: 12, padding: 16, color: "#fff", fontSize: 15, marginTop: 20, minHeight: 80, borderWidth: 1, borderColor: "#2a2a2a", textAlignVertical: "top" },
  runBtn: { backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 12 },
  runBtnDisabled: { opacity: 0.5 },
  runBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },
  logTitle: { color: "#888", fontSize: 13, marginTop: 24, marginBottom: 8 },
  logBox: { flex: 1, backgroundColor: "#111", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#2a2a2a" },
  logLine: { color: "#aaa", fontSize: 12, marginBottom: 4, fontFamily: "monospace" },
});