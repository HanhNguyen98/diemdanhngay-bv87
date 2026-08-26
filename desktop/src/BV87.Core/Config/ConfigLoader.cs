using System.IO;
using System.Text.Json;

namespace BV87.Core.Config;

public static class ConfigLoader
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    public static AppConfig Load(string baseDirectory)
    {
        var path = Path.Combine(baseDirectory, "appsettings.json");
        if (!File.Exists(path))
        {
            return new AppConfig();
        }

        var json = File.ReadAllText(path);
        return JsonSerializer.Deserialize<AppConfig>(json, JsonOptions) ?? new AppConfig();
    }

    public static void Save(string baseDirectory, AppConfig config)
    {
        var path = Path.Combine(baseDirectory, "appsettings.json");
        var json = JsonSerializer.Serialize(config, JsonOptions);
        File.WriteAllText(path, json);
    }
}
