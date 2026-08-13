// src/services/nativeAutomation.ts
// Thin typed wrapper around the native AutomationModule bridge.

import { NativeModules } from "react-native";

const { AutomationModule } = NativeModules;

export interface ScreenNode {
  text: string;
  clickable: boolean;
}

export const NativeAutomation = {
  isServiceEnabled: (): Promise<boolean> => AutomationModule.isServiceEnabled(),
  openAccessibilitySettings: (): void => AutomationModule.openAccessibilitySettings(),
  dumpScreenText: (): Promise<ScreenNode[]> => AutomationModule.dumpScreenText(),
  clickByText: (target: string): Promise<boolean> => AutomationModule.clickByText(target),
  typeIntoFocused: (text: string): Promise<boolean> => AutomationModule.typeIntoFocused(text),
  goBack: (): Promise<boolean> => AutomationModule.goBack(),
  goHome: (): Promise<boolean> => AutomationModule.goHome(),
};
