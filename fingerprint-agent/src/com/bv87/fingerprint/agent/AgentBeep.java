package com.bv87.fingerprint.agent;

import java.awt.Toolkit;
import java.io.BufferedInputStream;
import java.io.InputStream;

import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.Clip;
import javax.sound.sampled.DataLine;
import javax.sound.sampled.LineUnavailableException;
import javax.sound.sampled.SourceDataLine;

/**
 * Kiosk success/fail sounds for attendance Identify (SPEC §9.3.1 P2.1c).
 * Prefers classpath WAV chimes; falls back to PCM melody then {@link Toolkit#beep()}.
 */
public final class AgentBeep {

    private static final String SUCCESS_WAV = "/sounds/scan-success.wav";
    private static final String FAIL_WAV = "/sounds/scan-fail.wav";
    private static final float SAMPLE_RATE = 44_100f;
    private static final float AMPLITUDE = 0.5f;

    private static volatile boolean enabled = true;

    private AgentBeep() {
    }

    /** Enables or disables all agent sounds ({@code sound.enabled} in agent.properties). */
    public static void setEnabled(boolean value) {
        enabled = value;
    }

    public static boolean isEnabled() {
        return enabled;
    }

    /** Kiosk success chime — scan IN/OUT accepted. */
    public static void success() {
        playAsync(true);
    }

    /** Kiosk fail buzz — identify fail, API fail, REJECTED. */
    public static void failure() {
        playAsync(false);
    }

    private static void playAsync(boolean success) {
        if (!enabled) {
            return;
        }
        Thread t = new Thread(() -> {
            try {
                if (playClasspathWav(success ? SUCCESS_WAV : FAIL_WAV)) {
                    return;
                }
                if (playPcmMelody(success)) {
                    return;
                }
                toolkitPattern(success);
            } catch (Exception ex) {
                System.err.println("[FingerprintAgent] beep failed: " + ex.getMessage());
                toolkitPattern(success);
            }
        }, "agent-beep");
        t.setDaemon(true);
        t.start();
    }

    /** @return true if WAV played to completion */
    private static boolean playClasspathWav(String resourcePath) {
        try (InputStream raw = AgentBeep.class.getResourceAsStream(resourcePath)) {
            if (raw == null) {
                System.err.println("[FingerprintAgent] sound resource missing: " + resourcePath);
                return false;
            }
            try (BufferedInputStream buffered = new BufferedInputStream(raw);
                 AudioInputStream in = AudioSystem.getAudioInputStream(buffered)) {
                AudioFormat base = in.getFormat();
                DataLine.Info info = new DataLine.Info(Clip.class, base);
                if (!AudioSystem.isLineSupported(info)) {
                    AudioFormat pcm = new AudioFormat(
                            AudioFormat.Encoding.PCM_SIGNED,
                            base.getSampleRate() > 0 ? base.getSampleRate() : SAMPLE_RATE,
                            16,
                            base.getChannels() > 0 ? base.getChannels() : 1,
                            (base.getChannels() > 0 ? base.getChannels() : 1) * 2,
                            base.getSampleRate() > 0 ? base.getSampleRate() : SAMPLE_RATE,
                            false);
                    try (AudioInputStream converted = AudioSystem.getAudioInputStream(pcm, in)) {
                        return playClip(converted);
                    }
                }
                return playClip(in);
            }
        } catch (Exception ex) {
            System.err.println("[FingerprintAgent] WAV play failed (" + resourcePath + "): " + ex.getMessage());
            return false;
        }
    }

    private static boolean playClip(AudioInputStream in) throws Exception {
        Clip clip = AudioSystem.getClip();
        try {
            clip.open(in);
            clip.start();
            long ms = clip.getMicrosecondLength() / 1000L;
            if (ms <= 0) {
                ms = 400;
            }
            Thread.sleep(Math.min(ms + 40, 2_000));
            clip.drain();
            clip.stop();
            return true;
        } finally {
            try {
                clip.close();
            } catch (Exception ignored) {
                // ignore
            }
        }
    }

    /** Soft ascending/descending melody when WAV unavailable. */
    private static boolean playPcmMelody(boolean success) {
        try {
            if (success) {
                tone(880, 110, true);
                Thread.sleep(55);
                tone(1109, 170, true);
            } else {
                tone(220, 140, false);
                Thread.sleep(40);
                tone(165, 210, false);
            }
            return true;
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            return false;
        } catch (Exception ex) {
            System.err.println("[FingerprintAgent] PCM melody failed, Toolkit fallback: " + ex.getMessage());
            return false;
        }
    }

    private static void toolkitPattern(boolean success) {
        toolkitBeepOnce();
        sleepQuiet(110);
        toolkitBeepOnce();
        if (!success) {
            sleepQuiet(110);
            toolkitBeepOnce();
        }
    }

    private static void toolkitBeepOnce() {
        try {
            Toolkit.getDefaultToolkit().beep();
        } catch (Exception ignored) {
            // no audio device
        }
    }

    private static void sleepQuiet(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    private static void tone(int hz, int millis, boolean chimeHarmonics) throws LineUnavailableException {
        int sampleCount = Math.max(1, (int) (millis * SAMPLE_RATE / 1000));
        byte[] buf = new byte[sampleCount * 2];
        int fade = Math.min(400, sampleCount / 4);
        for (int i = 0; i < sampleCount; i++) {
            double t = i / SAMPLE_RATE;
            double s = Math.sin(2.0 * Math.PI * hz * t);
            if (chimeHarmonics) {
                s += 0.35 * Math.sin(2.0 * Math.PI * hz * 2 * t);
                s += 0.18 * Math.sin(2.0 * Math.PI * hz * 3 * t);
                s *= 0.65;
            }
            float env = 1f;
            if (i < fade) {
                env = i / (float) fade;
            } else if (i > sampleCount - fade) {
                env = Math.max(0f, (sampleCount - i) / (float) fade);
            }
            env *= (float) Math.exp(-3.0 * t / Math.max(0.05, millis / 1000.0));
            short val = (short) (s * AMPLITUDE * env * Short.MAX_VALUE);
            buf[i * 2] = (byte) (val & 0xff);
            buf[i * 2 + 1] = (byte) ((val >> 8) & 0xff);
        }
        AudioFormat format = new AudioFormat(SAMPLE_RATE, 16, 1, true, false);
        SourceDataLine line = AudioSystem.getSourceDataLine(format);
        if (line == null) {
            throw new LineUnavailableException("SourceDataLine is null");
        }
        try {
            line.open(format);
            line.start();
            int written = line.write(buf, 0, buf.length);
            if (written <= 0) {
                throw new LineUnavailableException("SourceDataLine write returned " + written);
            }
            line.drain();
        } finally {
            try {
                line.stop();
            } catch (Exception ignored) {
                // ignore
            }
            line.close();
        }
    }
}
