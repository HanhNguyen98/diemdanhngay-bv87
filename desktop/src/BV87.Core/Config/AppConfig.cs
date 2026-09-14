namespace BV87.Core.Config;

public sealed class AppConfig
{
    public string ApiBaseUrl { get; set; } = "http://localhost:8082";

    /// <summary>When true, ApiBaseUrl must resolve to hospital LAN CIDR (SPEC §1.1).</summary>
    public bool LanOnlyEnabled { get; set; }

    public string? SavedMode { get; set; }
    public string? KioskToken { get; set; }
}
