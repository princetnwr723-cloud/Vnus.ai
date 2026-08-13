// src/services/providers/index.ts
// Central registry of all 10 supported connectors.

import { makeOpenAICompatibleAdapter } from "./openaiCompatibleAdapter";
import { anthropicAdapter } from "./anthropicAdapter";
import { geminiAdapter } from "./geminiAdapter";
import type { ProviderAdapter } from "./types";

const openai = makeOpenAICompatibleAdapter({
  id: "openai",
  name: "OpenAI",
  baseUrl: "https://api.openai.com/v1",
  docsUrl: "https://platform.openai.com/docs",
  fallbackModels: [
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o mini" },
    { id: "o3", label: "o3" },
  ],
});

const openrouter = makeOpenAICompatibleAdapter({
  id: "openrouter",
  name: "OpenRouter",
  baseUrl: "https://openrouter.ai/api/v1",
  docsUrl: "https://openrouter.ai/docs",
  fallbackModels: [
    { id: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5 (via OpenRouter)" },
    { id: "openai/gpt-4o", label: "GPT-4o (via OpenRouter)" },
  ],
});

const groq = makeOpenAICompatibleAdapter({
  id: "groq",
  name: "Groq",
  baseUrl: "https://api.groq.com/openai/v1",
  docsUrl: "https://console.groq.com/docs",
  fallbackModels: [
    { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)" },
    { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B (Groq)" },
  ],
});

const mistral = makeOpenAICompatibleAdapter({
  id: "mistral",
  name: "Mistral",
  baseUrl: "https://api.mistral.ai/v1",
  docsUrl: "https://docs.mistral.ai",
  fallbackModels: [
    { id: "mistral-large-latest", label: "Mistral Large" },
    { id: "mistral-small-latest", label: "Mistral Small" },
  ],
});

const deepseek = makeOpenAICompatibleAdapter({
  id: "deepseek",
  name: "DeepSeek",
  baseUrl: "https://api.deepseek.com",
  docsUrl: "https://api-docs.deepseek.com",
  fallbackModels: [
    { id: "deepseek-chat", label: "DeepSeek Chat" },
    { id: "deepseek-reasoner", label: "DeepSeek Reasoner" },
  ],
});

const xai = makeOpenAICompatibleAdapter({
  id: "xai",
  name: "xAI (Grok)",
  baseUrl: "https://api.x.ai/v1",
  docsUrl: "https://docs.x.ai",
  fallbackModels: [
    { id: "grok-4", label: "Grok 4" },
    { id: "grok-4-fast", label: "Grok 4 Fast" },
  ],
});

const together = makeOpenAICompatibleAdapter({
  id: "together",
  name: "Together AI",
  baseUrl: "https://api.together.xyz/v1",
  docsUrl: "https://docs.together.ai",
  fallbackModels: [
    { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", label: "Llama 3.3 70B Turbo" },
  ],
});

const fireworks = makeOpenAICompatibleAdapter({
  id: "fireworks",
  name: "Fireworks AI",
  baseUrl: "https://api.fireworks.ai/inference/v1",
  docsUrl: "https://docs.fireworks.ai",
  fallbackModels: [
    { id: "accounts/fireworks/models/llama-v3p3-70b-instruct", label: "Llama 3.3 70B (Fireworks)" },
  ],
});

export const PROVIDERS: Record<string, ProviderAdapter> = {
  anthropic: anthropicAdapter,
  openai,
  openrouter,
  gemini: geminiAdapter,
  groq,
  mistral,
  deepseek,
  xai,
  together,
  fireworks,
};

export const PROVIDER_LIST = Object.values(PROVIDERS).map((p) => p.config);
