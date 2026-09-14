using System.IO;
using System.Text.Json;

namespace BV87.Core.Session;

/// <summary>Persists JWT session under %AppData%/BV87/session.json (SPEC_DESKTOP §2.3).</summary>
public static class SessionStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    public static string SessionDirectory =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "BV87");

    public static string SessionFilePath => Path.Combine(SessionDirectory, "session.json");

    public static PersistedSession? Load()
    {
        if (!File.Exists(SessionFilePath))
        {
            return null;
        }

        try
        {
            var json = File.ReadAllText(SessionFilePath);
            var session = JsonSerializer.Deserialize<PersistedSession>(json, JsonOptions);
            if (session == null || string.IsNullOrWhiteSpace(session.RefreshToken))
            {
                return null;
            }

            return session;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    public static void Save(PersistedSession session)
    {
        Directory.CreateDirectory(SessionDirectory);
        var json = JsonSerializer.Serialize(session, JsonOptions);
        File.WriteAllText(SessionFilePath, json);
    }

    public static void Delete()
    {
        if (File.Exists(SessionFilePath))
        {
            File.Delete(SessionFilePath);
        }
    }
}
