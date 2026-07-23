# noise-pomodoro

VS Code extension: ambient noise/binaural-beat generator + Pomodoro timer, playing entirely in a WebviewPanel via Web Audio / AudioWorklet. No network calls, no LLM APIs.

Reference project (UX/audio parity target): the user's other repo `noise_generator` (React/Vite PWA). See background sound + beat run as two independent, simultaneously-mixed layers in both projects — don't reintroduce an exclusive single-preset model.

## Four esbuild bundles (see `esbuild.js`), each with its own execution context — know which one a file belongs to before editing

| Bundle | Entry | Context | Source dirs |
|---|---|---|---|
| `dist/extension.js` | `src/extension.ts` | Node (extension host) | `src/{extension.ts,statusBar.ts,ui/,state/,pomodoro/,fileAccess/,scriptRunner/,utils/}` |
| `dist/media/ui.js` | `src/media/ui/main.ts` | Browser (webview UI) | `src/media/ui/**` |
| `dist/media/engine.js` | `src/media/audioEngine/engineClient.ts` | Browser (webview, same document as UI) | `src/media/audioEngine/engineClient.ts` |
| `dist/worklets/processors.js` | `src/audioEngine/worklets/index.ts` | AudioWorkletGlobalScope (no DOM/window/fetch) | `src/audioEngine/worklets/**` |

Message contracts between them are type-only, so they're safe to import across bundles:
- `src/protocol.ts` — extension ⇄ webview (`UiToExtMessage`/`ExtToUiMessage`) and extension ⇄ engine (`ExtToEngineMessage`/`EngineToExtMessage`).
- `src/audioEngine/worklets/messages.ts` — engineClient.ts ⇄ worklet processors (`WorkletInMessage`/`WorkletOutMessage`).
- `src/i18n/locale.ts` — `Locale` type + `resolveLocale()`, also shared across bundles (pure logic, no DOM/vscode dependency). Note this one *is* included via an explicit `tsconfig.webview.json` entry (like `protocol.ts`), not the `src/media/**` wildcard.

## Key files

- `src/extension.ts` — activation, all `UiToExtMessage` handling (`dispatchUiMessage`), status bar wiring, Pomodoro→preset/chime/script hookup. Repeated "mutate settings → persist → push/broadcast" cases go through the `updateLiveConfig`/`updateSettings` helpers defined near the top of `dispatchUiMessage` — reuse them for new `ui:setXxx` cases instead of re-inlining the pattern.
- `src/state/SettingsStore.ts` / `src/state/settings.ts` / `src/state/migrations.ts` — persisted settings (`NoisePomodoroSettings`, schema v2), defaults, and the deliberate "reset to defaults on any schema mismatch" migration policy (not a real per-field migrator — acceptable for this pre-1.0 personal project, don't "fix" it into one without being asked).
- `src/ui/AppWebview.ts` + `src/ui/appHtml.ts` — the single WebviewPanel hosting both UI and audio engine in one document (required so `AudioContext.resume()` sees a real user gesture).
- `src/media/ui/state.ts` — webview-side shared state + actions; `src/media/ui/views/*.ts` — one render function per UI section (header/controls/background/beat/presets/presetEditor/pomodoro), each importing only what it needs from `state.ts`/`dom.ts`/`constants.ts`. `main.ts` is just the render orchestrator + message wiring.
- `src/media/audioEngine/engineClient.ts` — owns the `AudioContext` graph: `backgroundGain`/`beatGain` → `masterGain`. Background (noise/file/custom) and beat (binaural/isochronic) are independent layers mixed at a fixed ~0.86/0.12 ratio when both are active. Uses a `mixEpoch` counter to discard stale async work (file decode, resume) when play/stop is called again before it resolves — preserve this pattern if touching async playback logic.
- `src/audioEngine/worklets/{noiseProcessor,toneProcessor,customCodeProcessor}.ts` + `dsp.ts` — the actual DSP running in the AudioWorklet. `customCodeProcessor.ts` runs user-supplied JS via `new Function`; it's sandboxed by AudioWorkletGlobalScope having no `window`/`fetch`/filesystem access, not by static analysis.
- `src/pomodoro/PomodoroTimer.ts` — pure timer state machine (idle/focus/break × stopped/running/paused), decoupled from the audio/UI side; driven by `extension.ts` callbacks (`onTick`/`onPhaseChange`/`onPhaseEnd`).
- `src/i18n/{ui,host,defaultSettings}/` — translated-string dictionaries (ja/en/fr/zh/es), one bucket per bundle/purpose (webview UI chrome, extension-host toasts/statusBar/dialogs, first-run default-settings seed text). Each bucket is an `interface` + 5 locale files + a `Record<Locale, T>`; locale files carry an explicit type annotation so a missing key is a `typecheck` failure, not a silent gap. Add new user-facing strings here (matching bucket) instead of hardcoding a literal — see "Conventions" below.

## Conventions

- Deliberately NOT ported from the PWA reference: PWA install prompt, MediaSession API — don't re-add for a VS Code host.
- Beat mode (binaural vs isochronic) is a global toggle (`lastUsed.beatMode`), not per-preset.
- UI-facing text (Webview labels/buttons, status bar, toasts, first-run default preset/chime names) is localized: ja (source language) / en / fr / zh / es, auto-selected from `vscode.env.language` (no in-app language switcher — see `src/i18n/**`). New user-facing strings must go through the matching `i18n` bucket's dictionaries for all 5 locales, not a hardcoded literal. Code comments stay Japanese regardless; match existing tone (comments explain *why*, not *what*). `package.json` manifest strings (command titles, settings descriptions) and Output Channel logs are intentionally NOT localized (out of scope, English/Japanese-mixed as-is).
- `npm run typecheck` checks all three tsconfigs (main/webview/worklet) — run it after touching any of the three browser-context bundles, since a mistaken cross-bundle import (e.g. DOM types leaking into worklet code) only shows up there, not in `tsc -p tsconfig.json` alone.
- Tests: `npm run test:unit` (mocha, pure-logic files only — format/migrations/PomodoroTimer). `npm test` runs the `@vscode/test-electron` integration test.
