using BV87.Core.Models;

namespace BV87.Core.Session;

public sealed class AppSession
{
    public string AccessToken { get; private set; } = string.Empty;
    public string RefreshToken { get; private set; } = string.Empty;
    public UserProfile? User { get; private set; }

    public bool IsAuthenticated => !string.IsNullOrWhiteSpace(AccessToken) && User != null;

    public void ApplyLogin(DesktopLoginResponse response)
    {
        AccessToken = response.AccessToken;
        RefreshToken = response.RefreshToken;
        User = response.User;
    }

    public void Clear()
    {
        AccessToken = string.Empty;
        RefreshToken = string.Empty;
        User = null;
    }
}
