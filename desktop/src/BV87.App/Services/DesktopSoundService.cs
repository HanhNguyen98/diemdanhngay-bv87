using System.Media;
using System.Windows;
using BV87.App.ViewModels.Utilities;

namespace BV87.App.Services;

/// <summary>Non-blocking UI sounds for desktop enroll feedback (SPEC §2.17.7 D1.1t).</summary>
public static class DesktopSoundService
{
    private const string SuccessWav = "Assets/Sounds/scan-success.wav";
    private const string FailWav = "Assets/Sounds/scan-fail.wav";

    private static volatile bool _enabled = true;

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
            switch (tone)
            {
                case FingerprintBannerTone.Success:
                    if (TryPlayEmbeddedWav(SuccessWav))
                    {
                        return;
                    }

                    PlaySuccessFallback();
                    return;

                case FingerprintBannerTone.Danger:
                    if (TryPlayEmbeddedWav(FailWav))
                    {
                        return;
                    }

                    PlayFailFallback();
                    return;

                case FingerprintBannerTone.Warning:
                    if (TryPlayWarningPattern())
                    {
                        return;
                    }

                    SystemSounds.Exclamation.Play();
                    break;
            }
        }
        catch
        {
            // No audio device — silent fallback.
        }
    }

    private static bool TryPlayEmbeddedWav(string relativePath)
    {
        try
        {
            var uri = new Uri($"pack://application:,,,/{relativePath}", UriKind.Absolute);
            var streamInfo = Application.GetResourceStream(uri);
            if (streamInfo?.Stream == null)
            {
                return false;
            }

            using var stream = streamInfo.Stream;
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

    private static void PlaySuccessFallback()
    {
        Console.Beep(880, 110);
        Thread.Sleep(55);
        Console.Beep(1109, 170);
    }

    private static void PlayFailFallback()
    {
        Console.Beep(190, 180);
        Thread.Sleep(90);
        Console.Beep(155, 180);
        Thread.Sleep(90);
        Console.Beep(120, 220);
    }

    private static bool TryPlayWarningPattern()
    {
        try
        {
            Console.Beep(784, 120);
            Thread.Sleep(80);
            Console.Beep(784, 120);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
