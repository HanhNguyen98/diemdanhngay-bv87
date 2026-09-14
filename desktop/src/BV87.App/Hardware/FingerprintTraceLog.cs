using System.IO;

namespace BV87.App.Hardware;

/// <summary>Append-only file log for fingerprint SDK failures (no UI — D1.1r).</summary>
internal static class FingerprintTraceLog
{
    private static readonly object Gate = new();
    private static readonly string LogPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "BV87",
        "fingerprint-trace.log");

    public static string FilePath => LogPath;

    public static void Clear()
    {
        lock (Gate)
        {
            var dir = Path.GetDirectoryName(LogPath)!;
            Directory.CreateDirectory(dir);
            File.WriteAllText(LogPath, $"{DateTime.Now:O} trace cleared{Environment.NewLine}");
        }
    }

    public static void Write(string phase, string detail = "")
    {
        var line = $"{DateTime.Now:HH:mm:ss.fff} {phase} {detail}".Trim();
        lock (Gate)
        {
            var dir = Path.GetDirectoryName(LogPath)!;
            Directory.CreateDirectory(dir);
            File.AppendAllText(LogPath, line + Environment.NewLine);
        }
    }
}
