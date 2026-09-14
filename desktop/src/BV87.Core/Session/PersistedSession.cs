namespace BV87.Core.Session;

public sealed class PersistedSession
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTimeOffset AccessTokenExpiresAtUtc { get; set; }
    public Models.UserProfile? User { get; set; }
    public string? LastMode { get; set; }
}
