// src/screens/ModelSelectScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { PROVIDERS } from "../services/providers";
import { getApiKey, setSelectedModel } from "../services/secureStorage";
import { useAppStore } from "../state/useAppStore";
import type { ModelInfo } from "../services/providers/types";

export default function ModelSelectScreen({ route, navigation }: any) {
  const { providerId } = route.params;
  const adapter = PROVIDERS[providerId];
  const [models, setModels] = useState<ModelInfo[]>(adapter.config.fallbackModels);
  const [loading, setLoading] = useState(true);
  const setConnected = useAppStore((s) => s.setConnected);

  useEffect(() => {
    (async () => {
      const key = await getApiKey(providerId);
      if (key) {
        const live = await adapter.listModels(key);
        setModels(live);
      }
      setLoading(false);
    })();
  }, [providerId]);

  const handleSelect = async (modelId: string) => {
    await setSelectedModel(modelId);
    setConnected(providerId, modelId);
    navigation.replace("Home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick a model</Text>
      <Text style={styles.subtitle}>{adapter.config.name}</Text>

      {loading ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={models}
          keyExtractor={(item) => item.id}
          style={{ marginTop: 20 }}
          renderItem={({ item }) => (
            <Pressable style={styles.modelRow} onPress={() => handleSelect(item.id)}>
              <Text style={styles.modelLabel}>{item.label}</Text>
              <Text style={styles.modelId}>{item.id}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 24, paddingTop: 64 },
  title: { color: "#fff", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#888", fontSize: 15, marginTop: 4 },
  modelRow: { backgroundColor: "#161616", borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#2a2a2a" },
  modelLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modelId: { color: "#666", fontSize: 12, marginTop: 4 },
});
