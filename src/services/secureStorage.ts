// src/services/secureStorage.ts
//
// expo-secure-store on Android is backed by the Android Keystore system —
// keys are encrypted at rest and tied to the device, not stored as plain
// text like the desktop agent's old github-state.json mistake we fixed
// earlier. This is the mobile equivalent of that fix, done right from
// the start.

import * as SecureStore from "expo-secure-store";

const KEY_PREFIX = "vnus_api_key_";
const CONNECTED_PROVIDER_KEY = "vnus_connected_provider";
const SELECTED_MODEL_KEY = "vnus_selected_model";

export async function saveApiKey(providerId: string, apiKey: string): Promise<void> {
  await SecureStore.setItemAsync(`${KEY_PREFIX}${providerId}`, apiKey, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

export async function getApiKey(providerId: string): Promise<string | null> {
  return SecureStore.getItemAsync(`${KEY_PREFIX}${providerId}`);
}

export async function deleteApiKey(providerId: string): Promise<void> {
  await SecureStore.deleteItemAsync(`${KEY_PREFIX}${providerId}`);
}

export async function setConnectedProvider(providerId: string): Promise<void> {
  await SecureStore.setItemAsync(CONNECTED_PROVIDER_KEY, providerId);
}

export async function getConnectedProvider(): Promise<string | null> {
  return SecureStore.getItemAsync(CONNECTED_PROVIDER_KEY);
}

export async function setSelectedModel(modelId: string): Promise<void> {
  await SecureStore.setItemAsync(SELECTED_MODEL_KEY, modelId);
}

export async function getSelectedModel(): Promise<string | null> {
  return SecureStore.getItemAsync(SELECTED_MODEL_KEY);
}

export async function disconnectAll(): Promise<void> {
  const provider = await getConnectedProvider();
  if (provider) await deleteApiKey(provider);
  await SecureStore.deleteItemAsync(CONNECTED_PROVIDER_KEY);
  await SecureStore.deleteItemAsync(SELECTED_MODEL_KEY);
}
