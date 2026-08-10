# Agent kiosk sounds (SPEC §9.3.1 P2.1c)

| File | Classpath | Usage |
|------|-----------|--------|
| `scan-success.wav` | `/sounds/scan-success.wav` | IN/OUT ghi nhận OK — chime lên cao |
| `scan-fail.wav` | `/sounds/scan-fail.wav` | Identify/API fail / REJECTED — buzz thấp |

PCM 16-bit mono 44100 Hz. Do **not** fetch audio from the network at runtime.
