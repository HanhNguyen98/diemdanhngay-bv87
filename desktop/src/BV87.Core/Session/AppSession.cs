using BV87.Core.Models;

using BV87.Core;

namespace BV87.Core.Session;

public sealed class AppSession
{
    public string AccessToken { get; private set; } = string.Empty;
    public string RefreshToken { get; private set; } = string.Empty;
    public DateTimeOffset AccessTokenExpiresAtUtc { get; private set; }
    public UserProfile? User { get; private set; }
    public AppMode? LastMode { get; private set; }

    public bool IsAuthenticated =>
        !string.IsNullOrWhiteSpace(AccessToken)
        && !string.IsNullOrWhiteSpace(RefreshToken)
        && User != null;

    public bool IsAccessTokenExpiringSoon(TimeSpan threshold) =>
        AccessTokenExpiresAtUtc <= DateTimeOffset.UtcNow.Add(threshold);

    public void ApplyLogin(DesktopLoginResponse response, AppMode? lastMode = null)
    {
        AccessToken = response.AccessToken;
        RefreshToken = response.RefreshToken;
        AccessTokenExpiresAtUtc = DateTimeOffset.UtcNow.AddSeconds(response.ExpiresInSeconds);
        User = response.User;
        if (lastMode != null)
        {
            LastMode = lastMode;
        }
    }

    public void SetLastMode(AppMode mode)
    {
        LastMode = mode;
    }

    public void LoadFrom(PersistedSession persisted)
    {
        AccessToken = persisted.AccessToken;
        RefreshToken = persisted.RefreshToken;
        AccessTokenExpiresAtUtc = persisted.AccessTokenExpiresAtUtc;
        User = persisted.User;
        LastMode = ParseMode(persisted.LastMode);
    }

    public PersistedSession ToPersisted()
    {
        return new PersistedSession
        {
            AccessToken = AccessToken,
            RefreshToken = RefreshToken,
            AccessTokenExpiresAtUtc = AccessTokenExpiresAtUtc,
            User = User,
            LastMode = LastMode?.ToString().ToLowerInvariant()
        };
    }

    public void Clear()
    {
        AccessToken = string.Empty;
        RefreshToken = string.Empty;
        AccessTokenExpiresAtUtc = DateTimeOffset.MinValue;
        User = null;
        LastMode = null;
    }

    private static AppMode? ParseMode(string? raw)
    {
        return raw?.ToLowerInvariant() switch
        {
            "head" => AppMode.Head,
            "admin" => AppMode.Admin,
            "duty" => AppMode.Duty,
            _ => null
        };
    }
}
