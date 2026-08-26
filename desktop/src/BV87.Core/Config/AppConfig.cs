namespace BV87.Core.Config;

public sealed class AppConfig
{
    public string ApiBaseUrl { get; set; } = "http://localhost:8082";
    public string? SavedMode { get; set; }
    public string? KioskToken { get; set; }
}
