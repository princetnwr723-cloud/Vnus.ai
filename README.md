# Agentic Vnus — Mobile (Android)

**Connect your own AI provider key, pick a model, and it automates tasks on your phone in the background.**

10 connectors supported: Anthropic, OpenAI, OpenRouter, Google Gemini, Groq, Mistral, DeepSeek, xAI (Grok), Together AI, Fireworks AI.

---

## Built for zero-PC development

This project is deliberately architected around **React Native (Expo) + EAS Build**, not native Android/Kotlin-in-Android-Studio, because building it doesn't need a computer:

1. Push code to GitHub (works from the GitHub mobile app on iPad)
2. `.github/workflows/build-android.yml` triggers automatically, or run `eas build` from any terminal
3. The actual compile happens on **Expo's cloud servers**, not your device
4. You get a download link for the finished `.apk` on [expo.dev](https://expo.dev)

No Android Studio. No local SDK. No PC required at any point.

---

## Architecture

```
User pastes API key → verified against provider → SecureStore (Android Keystore encrypted)
                                    ↓
                         Model list fetched live
                                    ↓
                    User types a task in plain English
                                    ↓
        agentLoop.ts: screen text → LLM → one JSON action → repeat
                                    ↓
     AutomationModule.kt (bridge) → AutomationAccessibilityService.kt
                                    ↓
                  Real taps / text entry / navigation on the phone
```

- **`src/services/providers/`** — one adapter per connector. 8 of the 10 share an OpenAI-compatible schema (one factory function); Anthropic and Gemini have their own adapters since their request/response shapes differ.
- **`src/services/secureStorage.ts`** — API keys encrypted via Android Keystore (`expo-secure-store`), not plaintext — this was a fix we already made once on the desktop agent (`githubAgent.js`); doing it right from the start here.
- **`modules/automation/`** — the real native Android code. `AutomationAccessibilityService.kt` reads the screen node tree and performs clicks/typing; `AutomationModule.kt` bridges it to JS.
- **`src/services/agentLoop.ts`** — the actual "automate my phone" loop: read screen → ask the model for one action → execute it → repeat, capped at 15 steps for safety. Same JSON-action pattern as the desktop agent's `brain.js`.
- **`plugins/withAccessibilityService.js`** — an Expo config plugin that injects the native service into `AndroidManifest.xml` automatically during the EAS cloud build, so custom native code works without a bare Android Studio project.

---

## ⚠️ Before you distribute this — read this section

**Google Play Store will scrutinize this app heavily.** Apps that request the Accessibility Service permission for general automation (not for an actual accessibility/disability use case) get rejected or later suspended under Play's Accessibility API policy. This isn't a maybe — it's one of the most actively enforced policies Google has.

**Practical path:**
1. **Start with direct APK distribution** — same model as the desktop app already uses (`.exe`/`.dmg` given directly to users, not through a store). EAS Build's `preview` profile produces exactly this kind of installable APK. This sidesteps Play policy entirely for now.
2. If/when you want Play Store distribution, you'll need a declared, reviewed accessibility use-case and to go through Google's permission declaration form — budget real time for this, it's not a checkbox.

**Also flag to users clearly, in-app:** this permission can technically read text across other apps. The `strings.xml` description in this repo states the limits honestly (no passive background collection, no transmission except to the connected provider for an active task) — keep that promise in the actual code as you build on this.

---

## What's real vs what's scaffold

Being direct, since overselling this internally would just mean you find out the hard way after building on top of it:

**Implemented and functional as written:**
- All 10 provider adapters (key verification, live model listing, chat calls)
- Encrypted key storage
- The accessibility service's screen-reading and click/type/back/home actions
- The agent loop wiring screen state → LLM → action → repeat

**Not yet built — real next steps, not small ones:**
- **Background/foreground service wiring.** Right now the agent loop runs while the app is open. Making it survive the app being backgrounded needs a proper Android foreground service with a persistent notification (Android requires this — you cannot silently automate in the background without one, by design, since Android 8+). `expo-task-manager` / `expo-background-fetch` are in `package.json` as a starting point but aren't wired into the automation loop yet.
- **Per-app automation reliability.** The accessibility tree approach here is a real, standard technique (it's how most Android automation tools work), but different apps render UI differently — some use custom views that don't expose clean text nodes. Expect to spend real iteration time here per app you want to support well.
- **Onboarding/permission UX polish**, error recovery mid-task, and a proper design pass (this uses plain `StyleSheet`, not a design system).
- **I have not compiled or run this.** I don't have Android tooling or network access in this environment. The code is written correctly against the real Expo/React Native/Android APIs, but the first EAS build is also your first real compile check — expect to fix a few real build errors, not because the architecture is wrong, but because that's normal for a from-scratch scaffold.

---

## Setup

1. Create a free [expo.dev](https://expo.dev) account, get an access token from Account Settings → Access Tokens.
2. In your GitHub repo: Settings → Secrets and variables → Actions → add `EXPO_TOKEN`.
3. Replace `REPLACE_WITH_YOUR_EAS_PROJECT_ID` in `app.json` (create a project at expo.dev to get one).
4. Push to `main` — the workflow fires, or trigger it manually from the GitHub Actions tab / GitHub mobile app.
5. Watch the build at expo.dev, download the `.apk` when it finishes, install directly on your Android phone.
