namespace BV87.Core.Models;

public sealed class DesktopLoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public string TokenType { get; set; } = "Bearer";
    public long ExpiresInSeconds { get; set; }
    public UserProfile User { get; set; } = new();
}
