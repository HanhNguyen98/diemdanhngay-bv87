using System.IO;
using System.Media;
using System.Text;
using System.Windows;
using System.Windows.Media;
using System.Windows.Threading;
using BV87.App.ViewModels.Utilities;

namespace BV87.App.Services;

/// <summary>Non-blocking UI sounds for enroll and agent scan (SPEC §2.17.7 D1.1t / D-UAT.1).</summary>
public static class DesktopSoundService
{
    private const string SuccessWav = "Assets/Sounds/scan-success.wav";
    private const string FailWav = "Assets/Sounds/scan-fail.wav";
    private const string TempNamePrefix = "duat1-";

    /// <summary>MediaPlayer volume 0–1; 1.0 = max player gain (does not change Windows mixer).</summary>
    private const double PlaybackVolume = 1.0;

    /// <summary>Peak full-scale after normalize — success chime (D-UAT.1).</summary>
    private const double SuccessPeakTarget = 0.90;

    /// <summary>Fail buzz louder than success (P2.1i / D-UAT.1).</summary>
    private const double FailPeakTarget = 0.97;

    private const double WarningPeakTarget = 0.90;
    private const double MaxGain = 12.0;
    private const int SampleRate = 44100;

    private static volatile bool _enabled = true;
    private static readonly object CacheGate = new();
    private static MediaPlayer? _player;
    private static byte[]? _warningWav;

    public static void SetEnabled(bool enabled) => _enabled = enabled;

    /// <summary>Plays tone-mapped feedback; Info/None are ignored.</summary>
    public static void Play(FingerprintBannerTone tone)
    {
        if (!_enabled || tone is FingerprintBannerTone.None or FingerprintBannerTone.Info)
        {
            return;
        }

        _ = Task.Run(() => PlayCore(tone));
    }

    private static void PlayCore(FingerprintBannerTone tone)
    {
        try
        {
            var wav = BuildPlaybackWav(tone);
            if (wav != null)
            {
                if (TryPlayMediaPlayer(wav, CacheName(tone)))
                {
                    return;
                }

                if (TryPlaySoundPlayer(wav))
                {
                    return;
                }
            }

            PlayLastResort(tone);
        }
        catch
        {
            // No audio device — silent fallback.
        }
    }

    private static byte[]? BuildPlaybackWav(FingerprintBannerTone tone)
    {
        return tone switch
        {
            FingerprintBannerTone.Success => PeakNormalizeResource(SuccessWav, SuccessPeakTarget),
            FingerprintBannerTone.Danger => PeakNormalizeResource(FailWav, FailPeakTarget),
            FingerprintBannerTone.Warning => GetWarningWav(),
            _ => null
        };
    }

    private static string CacheName(FingerprintBannerTone tone) =>
        tone switch
        {
            FingerprintBannerTone.Success => TempNamePrefix + "scan-success.wav",
            FingerprintBannerTone.Danger => TempNamePrefix + "scan-fail.wav",
            _ => TempNamePrefix + "scan-warning.wav"
        };

    private static byte[]? PeakNormalizeResource(string relativePath, double targetPeak)
    {
        var raw = ReadEmbeddedWav(relativePath);
        return raw == null ? null : PeakNormalizePcm16(raw, targetPeak);
    }

    private static byte[]? ReadEmbeddedWav(string relativePath)
    {
        try
        {
            var app = Application.Current;
            if (app == null)
            {
                return null;
            }

            if (app.Dispatcher.CheckAccess())
            {
                return ReadEmbeddedWavCore(relativePath);
            }

            return app.Dispatcher.Invoke(() => ReadEmbeddedWavCore(relativePath));
        }
        catch
        {
            return null;
        }
    }

    private static byte[]? ReadEmbeddedWavCore(string relativePath)
    {
        var uri = new Uri($"pack://application:,,,/{relativePath}", UriKind.Absolute);
        var streamInfo = Application.GetResourceStream(uri);
        if (streamInfo?.Stream == null)
        {
            return null;
        }

        using var stream = streamInfo.Stream;
        using var copy = new MemoryStream();
        stream.CopyTo(copy);
        return copy.ToArray();
    }

    private static byte[] GetWarningWav()
    {
        if (_warningWav != null)
        {
            return _warningWav;
        }

        lock (CacheGate)
        {
            _warningWav ??= BuildTwoBeepWav(WarningPeakTarget);
            return _warningWav;
        }
    }

    private static bool TryPlayMediaPlayer(byte[] wav, string fileName)
    {
        var app = Application.Current;
        if (app == null)
        {
            return false;
        }

        string path;
        try
        {
            path = WriteTempWav(fileName, wav);
        }
        catch
        {
            return false;
        }

        app.Dispatcher.BeginInvoke(() =>
        {
            try
            {
                _player?.Stop();
                _player?.Close();
                var player = new MediaPlayer { Volume = PlaybackVolume, Balance = 0 };
                _player = player;
                player.MediaEnded += (_, _) => ClosePlayer(player);
                player.MediaFailed += (_, _) =>
                {
                    ClosePlayer(player);
                    _ = Task.Run(() => TryPlaySoundPlayer(wav));
                };
                player.MediaOpened += (_, _) =>
                {
                    player.Volume = PlaybackVolume;
                    player.Play();
                };
                player.Open(new Uri(path, UriKind.Absolute));
            }
            catch
            {
                _ = Task.Run(() => TryPlaySoundPlayer(wav));
            }
        }, DispatcherPriority.Normal);

        return true;
    }

    private static void ClosePlayer(MediaPlayer player)
    {
        try
        {
            player.Stop();
            player.Close();
        }
        catch
        {
            // Ignore close errors after playback.
        }

        if (ReferenceEquals(_player, player))
        {
            _player = null;
        }
    }

    private static bool TryPlaySoundPlayer(byte[] wav)
    {
        try
        {
            using var stream = new MemoryStream(wav, writable: false);
            using var player = new SoundPlayer(stream);
            player.Load();
            player.PlaySync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static void PlayLastResort(FingerprintBannerTone tone)
    {
        switch (tone)
        {
            case FingerprintBannerTone.Success:
                Console.Beep(880, 110);
                Thread.Sleep(55);
                Console.Beep(1109, 170);
                return;
            case FingerprintBannerTone.Danger:
                Console.Beep(190, 180);
                Thread.Sleep(90);
                Console.Beep(155, 180);
                Thread.Sleep(90);
                Console.Beep(120, 220);
                return;
            default:
                try
                {
                    SystemSounds.Exclamation.Play();
                }
                catch
                {
                    // Silent.
                }

                return;
        }
    }

    private static string WriteTempWav(string fileName, byte[] wav)
    {
        var dir = Path.Combine(Path.GetTempPath(), "BV87", "sounds");
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, fileName);
        lock (CacheGate)
        {
            if (!File.Exists(path) || new FileInfo(path).Length != wav.Length)
            {
                File.WriteAllBytes(path, wav);
            }
        }

        return path;
    }

    /// <summary>Peak-normalizes 16-bit PCM WAV; returns original bytes if not PCM16.</summary>
    private static byte[] PeakNormalizePcm16(byte[] wav, double targetPeak)
    {
        if (wav.Length < 44
            || wav[0] != (byte)'R'
            || wav[1] != (byte)'I'
            || wav[2] != (byte)'F'
            || wav[3] != (byte)'F')
        {
            return wav;
        }

        if (!TryFindPcm16Data(wav, out var dataOffset, out var dataSize))
        {
            return wav;
        }

        var sampleCount = dataSize / 2;
        if (sampleCount <= 0)
        {
            return wav;
        }

        var result = (byte[])wav.Clone();
        var peak = 1;
        for (var i = 0; i < sampleCount; i++)
        {
            var sample = BitConverter.ToInt16(result, dataOffset + (i * 2));
            var abs = sample == short.MinValue ? short.MaxValue : Math.Abs(sample);
            if (abs > peak)
            {
                peak = abs;
            }
        }

        var gain = (targetPeak * short.MaxValue) / peak;
        if (gain > MaxGain)
        {
            gain = MaxGain;
        }

        if (gain <= 1.02)
        {
            return result;
        }

        for (var i = 0; i < sampleCount; i++)
        {
            var sample = BitConverter.ToInt16(result, dataOffset + (i * 2));
            var scaled = (int)Math.Round(sample * gain);
            if (scaled > short.MaxValue)
            {
                scaled = short.MaxValue;
            }
            else if (scaled < short.MinValue)
            {
                scaled = short.MinValue;
            }

            var bytes = BitConverter.GetBytes((short)scaled);
            result[dataOffset + (i * 2)] = bytes[0];
            result[dataOffset + (i * 2) + 1] = bytes[1];
        }

        return result;
    }

    private static bool TryFindPcm16Data(byte[] wav, out int dataOffset, out int dataSize)
    {
        dataOffset = 0;
        dataSize = 0;
        var offset = 12;
        var audioFormat = 0;
        var bitsPerSample = 0;

        while (offset + 8 <= wav.Length)
        {
            var chunkId = Encoding.ASCII.GetString(wav, offset, 4);
            var chunkSize = BitConverter.ToInt32(wav, offset + 4);
            if (chunkSize < 0)
            {
                return false;
            }

            var body = offset + 8;
            if (chunkId == "fmt " && body + 16 <= wav.Length)
            {
                audioFormat = BitConverter.ToInt16(wav, body);
                bitsPerSample = BitConverter.ToInt16(wav, body + 14);
            }
            else if (chunkId == "data")
            {
                if (audioFormat != 1 || bitsPerSample != 16)
                {
                    return false;
                }

                var available = wav.Length - body;
                dataSize = Math.Min(chunkSize, available);
                dataSize -= dataSize % 2;
                dataOffset = body;
                return dataSize > 0;
            }

            offset = body + chunkSize;
            if ((chunkSize & 1) != 0)
            {
                offset++;
            }
        }

        return false;
    }

    private static byte[] BuildTwoBeepWav(double peak)
    {
        const int beepMs = 120;
        const int gapMs = 80;
        var beepSamples = SampleRate * beepMs / 1000;
        var gapSamples = SampleRate * gapMs / 1000;
        var total = (beepSamples * 2) + gapSamples;
        var samples = new short[total];
        var amplitude = (int)Math.Round(peak * short.MaxValue);
        WriteSine(samples, 0, beepSamples, 784, amplitude);
        WriteSine(samples, beepSamples + gapSamples, beepSamples, 784, amplitude);
        return WrapPcm16Wav(samples);
    }

    private static void WriteSine(short[] dest, int start, int count, double hz, int amplitude)
    {
        for (var i = 0; i < count; i++)
        {
            var t = (double)i / SampleRate;
            var envelope = 1.0;
            var fade = Math.Min(40, count / 8);
            if (i < fade)
            {
                envelope = (double)i / fade;
            }
            else if (i > count - fade)
            {
                envelope = (double)(count - i) / fade;
            }

            dest[start + i] = (short)Math.Round(Math.Sin(2 * Math.PI * hz * t) * amplitude * envelope);
        }
    }

    private static byte[] WrapPcm16Wav(short[] samples)
    {
        var dataSize = samples.Length * 2;
        var wav = new byte[44 + dataSize];
        Encoding.ASCII.GetBytes("RIFF").CopyTo(wav, 0);
        BitConverter.GetBytes(36 + dataSize).CopyTo(wav, 4);
        Encoding.ASCII.GetBytes("WAVE").CopyTo(wav, 8);
        Encoding.ASCII.GetBytes("fmt ").CopyTo(wav, 12);
        BitConverter.GetBytes(16).CopyTo(wav, 16);
        BitConverter.GetBytes((short)1).CopyTo(wav, 20);
        BitConverter.GetBytes((short)1).CopyTo(wav, 22);
        BitConverter.GetBytes(SampleRate).CopyTo(wav, 24);
        BitConverter.GetBytes(SampleRate * 2).CopyTo(wav, 28);
        BitConverter.GetBytes((short)2).CopyTo(wav, 32);
        BitConverter.GetBytes((short)16).CopyTo(wav, 34);
        Encoding.ASCII.GetBytes("data").CopyTo(wav, 36);
        BitConverter.GetBytes(dataSize).CopyTo(wav, 40);
        Buffer.BlockCopy(samples, 0, wav, 44, dataSize);
        return wav;
    }
}
