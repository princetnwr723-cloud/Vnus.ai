// src/services/nativeAutomation.ts
// Thin typed wrapper around the native AutomationModule (Expo Modules API).
// Wrapped defensively: if the native module fails to link for any reason,
// calls resolve to a safe default instead of crashing the whole app.

import { requireNativeModule } from "expo-modules-core";

export interface ScreenNode {
  text: string;
  clickable: boolean;
}

let AutomationModule: any = null;
let loadError: string | null = null;

try {
  AutomationModule = requireNativeModule("AutomationModule");
} catch (err: any) {
  loadError = err?.message || String(err);
  console.warn("AutomationModule failed to load:", loadError);
}

function guard<T>(fn: (() => Promise<T>) | undefined, fallback: T): Promise<T> {
  if (!AutomationModule || typeof fn !== "function") {
    return Promise.resolve(fallback);
  }
  return fn();
}

export const NativeAutomation = {
  isNativeModuleAvailable: (): boolean => !!AutomationModule,
  nativeModuleError: (): string | null => loadError,

  isServiceEnabled: (): Promise<boolean> =>
    guard(() => AutomationModule.isServiceEnabled(), false),

  openAccessibilitySettings: (): Promise<void> =>
    guard(() => AutomationModule.openAccessibilitySettings(), undefined as any),

  dumpScreenText: (): Promise<ScreenNode[]> =>
    guard(() => AutomationModule.dumpScreenText(), []),

  clickByText: (target: string): Promise<boolean> =>
    guard(() => AutomationModule.clickByText(target), false),

  typeIntoFocused: (text: string): Promise<boolean> =>
    guard(() => AutomationModule.typeIntoFocused(text), false),

  goBack: (): Promise<boolean> => guard(() => AutomationModule.goBack(), false),
  goHome: (): Promise<boolean> => guard(() => AutomationModule.goHome(), false),
};