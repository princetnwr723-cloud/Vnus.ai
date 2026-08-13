// src/screens/ConnectScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { PROVIDER_LIST, PROVIDERS } from "../services/providers";
import { saveApiKey, setConnectedProvider } from "../services/secureStorage";

export default function ConnectScreen({ navigation }: any) {
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleConnect = async () => {
    if (!selectedProviderId || !apiKey.trim()) {
      Alert.alert("Missing info", "Pick a provider and paste your API key.");
      return;
    }
    setVerifying(true);
    try {
      const adapter = PROVIDERS[selectedProviderId];
      const valid = await adapter.verifyKey(apiKey.trim());
      if (!valid) {
        Alert.alert("Invalid key", `Could not verify this key with ${adapter.config.name}. Double-check it and try again.`);
        setVerifying(false);
        return;
      }
      await saveApiKey(selectedProviderId, apiKey.trim());
      await setConnectedProvider(selectedProviderId);
      navigation.replace("ModelSelect", { providerId: selectedProviderId });
    } catch (err: any) {
      Alert.alert("Connection error", err?.message || "Something went wrong verifying the key.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect a provider</Text>
      <Text style={styles.subtitle}>Your key is encrypted on-device (Android Keystore). It never leaves your phone except to talk to the provider you pick.</Text>

      <FlatList
        data={PROVIDER_LIST}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginVertical: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedProviderId(item.id)}
            style={[styles.providerChip, selectedProviderId === item.id && styles.providerChipActive]}
          >
            <Text style={[styles.providerChipText, selectedProviderId === item.id && styles.providerChipTextActive]}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />

      <TextInput
        placeholder="Paste your API key"
        placeholderTextColor="#666"
        value={apiKey}
        onChangeText={setApiKey}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />

      <Pressable style={styles.connectBtn} onPress={handleConnect} disabled={verifying}>
        {verifying ? <ActivityIndicator color="#000" /> : <Text style={styles.connectBtnText}>Connect</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 24, paddingTop: 64 },
  title: { color: "#fff", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#888", fontSize: 14, marginTop: 8, lineHeight: 20 },
  providerChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#333", marginRight: 8 },
  providerChipActive: { backgroundColor: "#fff", borderColor: "#fff" },
  providerChipText: { color: "#ccc", fontSize: 14 },
  providerChipTextActive: { color: "#000", fontWeight: "600" },
  input: { backgroundColor: "#161616", borderRadius: 12, padding: 16, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "#2a2a2a" },
  connectBtn: { backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 20 },
  connectBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },
});
