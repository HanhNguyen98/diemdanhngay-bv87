using System.IO;
using System.Text.Json;

namespace BV87.Core.Config;

/// <summary>Loads agent.config.json or agent.properties from the app base directory.</summary>
public static class AgentConfigLoader
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    public static AgentConfig Load(string baseDirectory)
    {
        var jsonPath = Path.Combine(baseDirectory, "agent.config.json");
        if (File.Exists(jsonPath))
        {
            var json = File.ReadAllText(jsonPath);
            return ApplyPolicy(JsonSerializer.Deserialize<AgentConfig>(json, JsonOptions) ?? new AgentConfig());
        }

        var propsPath = Path.Combine(baseDirectory, "agent.properties");
        if (!File.Exists(propsPath))
        {
            var examplePath = Path.Combine(baseDirectory, "agent.config.json.example");
            if (File.Exists(examplePath))
            {
                var json = File.ReadAllText(examplePath);
                return ApplyPolicy(JsonSerializer.Deserialize<AgentConfig>(json, JsonOptions) ?? new AgentConfig());
            }

            return ApplyPolicy(new AgentConfig());
        }

        return ApplyPolicy(LoadFromProperties(propsPath));
    }

    private static AgentConfig LoadFromProperties(string path)
    {
        var props = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var rawLine in File.ReadAllLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }

            var eq = line.IndexOf('=');
            if (eq <= 0)
            {
                continue;
            }

            props[line[..eq].Trim()] = line[(eq + 1)..].Trim();
        }

        return new AgentConfig
        {
            ApiBaseUrl = Get(props, "api.baseUrl", "http://localhost:8082"),
            KioskToken = Get(props, "kiosk.token", string.Empty),
            SoundEnabled = ParseBool(Get(props, "sound.enabled", "true"), true),
            DeviceAutoOpen = ParseBool(Get(props, "device.autoOpen", "true"), true),
            DeviceAutoOpenRetries = ParseBoundedInt(Get(props, "device.autoOpenRetries", "5"), 5, 1, 20),
            DeviceAutoOpenRetryMs = ParseBoundedInt(Get(props, "device.autoOpenRetryMs", "800"), 800, 200, 10_000),
            HeartbeatEnabled = ParseBool(Get(props, "heartbeat.enabled", "true"), true),
            HeartbeatIntervalSeconds = ParseBoundedInt(Get(props, "heartbeat.intervalSeconds", "30"), 30, 15, 300),
            LanOnlyEnabled = ParseBool(Get(props, "lanOnly.enabled", "true"), true)
        };
    }

    private static string Get(IReadOnlyDictionary<string, string> props, string key, string fallback) =>
        props.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value) ? value : fallback;

    private static bool ParseBool(string raw, bool fallback)
    {
        if (bool.TryParse(raw, out var value))
        {
            return value;
        }

        return raw.Equals("1", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("yes", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("on", StringComparison.OrdinalIgnoreCase)
            || (fallback && raw.Equals("true", StringComparison.OrdinalIgnoreCase));
    }

    private static AgentConfig ApplyPolicy(AgentConfig config)
    {
        LanDeploymentPolicy.Apply(config);
        return config;
    }

    private static int ParseBoundedInt(string raw, int fallback, int min, int max)
    {
        if (!int.TryParse(raw, out var value))
        {
            return fallback;
        }

        return Math.Clamp(value, min, max);
    }
}
