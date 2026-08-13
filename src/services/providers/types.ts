// src/services/providers/types.ts

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ModelInfo {
  id: string;        // model id to send in requests
  label: string;      // human-readable name shown in the picker
}

export interface ProviderConfig {
  id: string;             // internal key, e.g. "anthropic"
  name: string;            // display name, e.g. "Anthropic"
  baseUrl: string;
  docsUrl: string;
  // Static fallback list shown instantly + used if the live /models call fails.
  fallbackModels: ModelInfo[];
}

export interface ProviderAdapter {
  config: ProviderConfig;
  /** Verify the key works. Returns true/false, never throws. */
  verifyKey(apiKey: string): Promise<boolean>;
  /** Fetch live model list from the provider. Falls back to config.fallbackModels on failure. */
  listModels(apiKey: string): Promise<ModelInfo[]>;
  /** Send a chat completion request and get back plain text. */
  chat(apiKey: string, model: string, messages: ChatMessage[]): Promise<string>;
}
