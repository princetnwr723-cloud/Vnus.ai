// src/state/useAppStore.ts
import { create } from "zustand";

interface AppState {
  connectedProviderId: string | null;
  selectedModel: string | null;
  isAutomationRunning: boolean;
  lastTaskLog: string[];

  setConnected: (providerId: string, model: string) => void;
  disconnect: () => void;
  setAutomationRunning: (running: boolean) => void;
  appendLog: (line: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  connectedProviderId: null,
  selectedModel: null,
  isAutomationRunning: false,
  lastTaskLog: [],

  setConnected: (providerId, model) =>
    set({ connectedProviderId: providerId, selectedModel: model }),

  disconnect: () =>
    set({ connectedProviderId: null, selectedModel: null, isAutomationRunning: false }),

  setAutomationRunning: (running) => set({ isAutomationRunning: running }),

  appendLog: (line) =>
    set((s) => ({ lastTaskLog: [...s.lastTaskLog.slice(-49), line] })),
}));
