// src/services/providers/geminiAdapter.ts
// Gemini's generateContent API has its own request/response shape and
// puts the API key in the URL as a query param rather than a header.

import type { ProviderAdapter, ChatMessage, ModelInfo } from "./types";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export const geminiAdapter: ProviderAdapter = {
  config: {
    id: "gemini",
    name: "Google Gemini",
    baseUrl: BASE_URL,
    docsUrl: "https://ai.google.dev/docs",
    fallbackModels: [
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    ],
  },

  async verifyKey(apiKey: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/models?key=${apiKey}`);
      return res.ok;
    } catch {
      return false;
    }
  },

  async listModels(apiKey: string): Promise<ModelInfo[]> {
    try {
      const res = await fetch(`${BASE_URL}/models?key=${apiKey}`);
      if (!res.ok) return geminiAdapter.config.fallbackModels;
      const data = await res.json();
      const list = (data?.models || [])
        .filter((m: any) => (m.supportedGenerationMethods || []).includes("generateContent"))
        .map((m: any) => ({ id: m.name.replace("models/", ""), label: m.displayName || m.name }));
      return list.length ? list : geminiAdapter.config.fallbackModels;
    } catch {
      return geminiAdapter.config.fallbackModels;
    }
  },

  async chat(apiKey: string, model: string, messages: ChatMessage[]): Promise<string> {
    const systemMsg = messages.find((m) => m.role === "system")?.content;
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: any = { contents };
    if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg }] };

    const res = await fetch(`${BASE_URL}/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  },
};
