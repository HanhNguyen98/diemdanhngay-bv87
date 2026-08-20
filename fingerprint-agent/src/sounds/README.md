# Agent kiosk sounds (SPEC §9.3.1 P2.1c / P2.1i)

| File | Classpath | Usage |
|------|-----------|--------|
| `scan-success.wav` | `/sounds/scan-success.wav` | IN/OUT ghi nhận OK — chime lên cao |
| `scan-fail.wav` | `/sounds/scan-fail.wav` | Identify/API fail / REJECTED — **3 buzz thấp ~850ms**, amplitude cao (P2.1i) |

PCM 16-bit mono 44100 Hz. Do **not** fetch audio from the network at runtime.

Rebuild Agent JAR after changing WAV so classpath resources update (`scripts/build-agent-jar.ps1`).
