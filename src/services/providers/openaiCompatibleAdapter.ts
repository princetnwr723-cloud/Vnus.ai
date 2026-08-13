// src/services/providers/openaiCompatibleAdapter.ts
//
// Most LLM providers (OpenAI, OpenRouter, Groq, Mistral, DeepSeek, xAI,
// Together, Fireworks) expose an OpenAI-compatible /chat/completions and
// /models endpoint. Rather than writing 8 near-identical adapters, this
// factory builds one from a ProviderConfig.

import type { ProviderAdapter, ProviderConfig, ChatMessage, ModelInfo } from "./types";

export function makeOpenAICompatibleAdapter(config: ProviderConfig): ProviderAdapter {
  return {
    config,

    async verifyKey(apiKey: string): Promise<boolean> {
      try {
        const res = await fetch(`${config.baseUrl}/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return res.ok;
      } catch {
        return false;
      }
    },

    async listModels(apiKey: string): Promise<ModelInfo[]> {
      try {
        const res = await fetch(`${config.baseUrl}/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return config.fallbackModels;
        const data = await res.json();
        const list = (data?.data || [])
          .map((m: any) => ({ id: m.id, label: m.id }))
          .slice(0, 50);
        return list.length ? list : config.fallbackModels;
      } catch {
        return config.fallbackModels;
      }
    },

    async chat(apiKey: string, model: string, messages: ChatMessage[]): Promise<string> {
      const res = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, temperature: 0.4 }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`${config.name} API error (${res.status}): ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      return data?.choices?.[0]?.message?.content ?? "";
    },
  };
}
