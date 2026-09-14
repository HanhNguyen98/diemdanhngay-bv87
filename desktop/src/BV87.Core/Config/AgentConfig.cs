namespace BV87.Core.Config;

/// <summary>Kiosk fingerprint agent settings (parity Java agent.properties).</summary>
public sealed class AgentConfig
{
    public string ApiBaseUrl { get; set; } = "http://localhost:8082";

    public string KioskToken { get; set; } = string.Empty;

    public bool SoundEnabled { get; set; } = true;

    public bool DeviceAutoOpen { get; set; } = true;

    public int DeviceAutoOpenRetries { get; set; } = 5;

    public int DeviceAutoOpenRetryMs { get; set; } = 800;

    public bool HeartbeatEnabled { get; set; } = true;

    public int HeartbeatIntervalSeconds { get; set; } = 30;

    /// <summary>Reload Identify template cache interval (minutes).</summary>
    public int TemplateReloadMinutes { get; set; } = 30;

    /// <summary>When true, apiBaseUrl must resolve to hospital LAN CIDR (SPEC §1.1).</summary>
    public bool LanOnlyEnabled { get; set; } = true;
}
