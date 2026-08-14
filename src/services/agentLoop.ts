// src/services/agentLoop.ts
//
// The actual "automate my phone" loop:
//  1. Read what's on screen (native accessibility dump)
//  2. Send it + the task + history to the connected LLM
//  3. LLM responds with ONE action as JSON
//  4. Execute that action natively
//  5. Repeat, capped at MAX_STEPS, until the model says "done"
//
// This mirrors the desktop agent's brain.js pattern (JSON action parsing,
// step-by-step execution) but the "hands" here are the Accessibility
// Service instead of shell commands.

import { NativeAutomation } from "./nativeAutomation";
import { PROVIDERS } from "./providers";
import { getApiKey } from "./secureStorage";
import type { ChatMessage } from "./providers/types";

const MAX_STEPS = 15;
// Keep only the last few screen-read turns in history so prompt size
// doesn't grow unbounded across 15 steps (each screen dump can be large).
const MAX_HISTORY_TURNS = 6;

export interface AgentStepResult {
  step: number;
  reasoning: string;
  action: string;
  done: boolean;
}

const SYSTEM_PROMPT = `You control an Android phone through an accessibility layer.
You will be given the current visible screen text and a task.
Respond with ONLY valid JSON, one action at a time:

{"reasoning": "short explanation", "action": "click", "target": "exact visible text to click"}
{"reasoning": "short explanation", "action": "type", "text": "text to type into the focused field"}
{"reasoning": "short explanation", "action": "back"}
{"reasoning": "short explanation", "action": "home"}
{"reasoning": "short explanation", "action": "done", "summary": "what was accomplished"}

Only ever output one action. Never explain outside the JSON. If the task is
complete or cannot proceed safely, use "done".`;

/** Extracts the first balanced {...} JSON object from a model response,
 *  rather than a greedy regex that can swallow stray braces in reasoning text. */
function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export async function runAgentTask(
  task: string,
  providerId: string,
  model: string,
  onStep?: (result: AgentStepResult) => void
): Promise<string> {
  const apiKey = await getApiKey(providerId);
  if (!apiKey) throw new Error("No API key found for the connected provider.");

  const adapter = PROVIDERS[providerId];
  const history: ChatMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];

  for (let step = 1; step <= MAX_STEPS; step++) {
    const enabled = await NativeAutomation.isServiceEnabled();
    if (!enabled) {
      throw new Error("Accessibility service is not enabled. Enable it in Settings first.");
    }

    const screenNodes = await NativeAutomation.dumpScreenText();
    const screenSummary = screenNodes
      .slice(0, 80) // cap context size
      .map((n) => `${n.clickable ? "[clickable] " : ""}${n.text}`)
      .join("\n");

    history.push({
      role: "user",
      content: `TASK: ${task}\n\nCURRENT SCREEN:\n${screenSummary || "(empty/unrecognized screen)"}\n\nWhat's the next single action?`,
    });

    // Trim history: always keep the system prompt (index 0) + only the
    // most recent turns, so token usage doesn't grow unbounded step-over-step.
    if (history.length > 1 + MAX_HISTORY_TURNS * 2) {
      history.splice(1, history.length - (1 + MAX_HISTORY_TURNS * 2));
    }

    const response = await adapter.chat(apiKey, model, history);
    const jsonStr = extractFirstJsonObject(response);
    if (!jsonStr) throw new Error(`Model did not return valid JSON: ${response.slice(0, 200)}`);

    const parsed = JSON.parse(jsonStr);
    history.push({ role: "assistant", content: jsonStr });

    onStep?.({
      step,
      reasoning: parsed.reasoning || "",
      action: parsed.action,
      done: parsed.action === "done",
    });

    switch (parsed.action) {
      case "click":
        await NativeAutomation.clickByText(parsed.target);
        break;
      case "type":
        await NativeAutomation.typeIntoFocused(parsed.text);
        break;
      case "back":
        await NativeAutomation.goBack();
        break;
      case "home":
        await NativeAutomation.goHome();
        break;
      case "done":
        return parsed.summary || "Task completed.";
      default:
        throw new Error(`Unknown action from model: ${parsed.action}`);
    }

    // Give the UI a moment to settle before the next screen read.
    await new Promise((r) => setTimeout(r, 800));
  }

  throw new Error(`Task did not complete within ${MAX_STEPS} steps — stopped for safety.`);
}