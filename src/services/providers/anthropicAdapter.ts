// src/services/providers/anthropicAdapter.ts
// Anthropic's Messages API has a different shape from OpenAI's — separate
// system prompt field, different auth header, and its own response schema.

import type { ProviderAdapter, ChatMessage, ModelInfo } from "./types";

const BASE_URL = "https://api.anthropic.com/v1";
const ANTHROPIC_VERSION = "2023-06-01";

export const anthropicAdapter: ProviderAdapter = {
  config: {
    id: "anthropic",
    name: "Anthropic",
    baseUrl: BASE_URL,
    docsUrl: "https://docs.claude.com",
    fallbackModels: [
      { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
      { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
  },

  async verifyKey(apiKey: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/models`, {
        headers: { "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async listModels(apiKey: string): Promise<ModelInfo[]> {
    try {
      const res = await fetch(`${BASE_URL}/models`, {
        headers: { "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION },
      });
      if (!res.ok) return anthropicAdapter.config.fallbackModels;
      const data = await res.json();
      const list = (data?.data || []).map((m: any) => ({ id: m.id, label: m.display_name || m.id }));
      return list.length ? list : anthropicAdapter.config.fallbackModels;
    } catch {
      return anthropicAdapter.config.fallbackModels;
    }
  },

  async chat(apiKey: string, model: string, messages: ChatMessage[]): Promise<string> {
    const systemMsg = messages.find((m) => m.role === "system")?.content;
    const conversation = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await fetch(`${BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        system: systemMsg,
        messages: conversation,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Anthropic API error (${res.status}): ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    return (data?.content || []).map((b: any) => b.text || "").join("");
  },
};
