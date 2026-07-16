# White Noise & Pomodoro

Procedurally generated white/pink/brown noise, isochronic tones, binaural beats and solfeggio
frequencies, plus local audio file playback and a JavaScript custom-code sound mode -- combined
with a Pomodoro timer that switches sounds between focus and break phases.

## Features

- **Procedural audio**: white/pink/brown noise, isochronic tones, binaural beats, solfeggio frequencies -- all generated on an AudioWorklet thread so UI interaction never causes glitches.
- **File playback**: point at any local audio file.
- **Custom code mode**: write a JavaScript formula (`t` = seconds, `params` = your own parameters, return a value between -1 and 1) and hear it live.
- **Pomodoro timer**: independent focus/break durations, a sound preset per phase, auto-advance, and an end-of-phase action (toast notification, a one-shot chime, and/or a custom script).
- **Status bar first**: click the status bar item to open the panel; close the panel and playback keeps running -- the status bar remains the control surface, Zen Mode included.

## Usage

1. Click the status bar item (or run **White Noise: Open Panel**) to open the panel.
2. Pick a sound preset to start playback.
3. Configure focus/break durations and sounds in the Pomodoro section, then press Start.

## Settings

- `whiteNoise.enablePhaseEndScripts` -- opt-in gate for phase-end custom scripts (off by default; these run with extension-host/Node access, so only enable it for scripts you wrote yourself).
- `whiteNoise.statusBar.updateIntervalMs` -- Pomodoro status bar tick interval (default `1000`).

## Development

```
npm install
npm run watch   # esbuild in watch mode
```

Press F5 in VS Code to launch an Extension Development Host.
