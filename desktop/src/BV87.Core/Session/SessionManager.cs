using BV87.Core;
using BV87.Core.Api;

namespace BV87.Core.Session;

/// <summary>Coordinates in-memory session, disk persist, and token refresh (SPEC_DESKTOP §2.3).</summary>
public sealed class SessionManager
{
    private static readonly TimeSpan RefreshThreshold = TimeSpan.FromMinutes(5);

    private readonly SemaphoreSlim _refreshLock = new(1, 1);
    private readonly AppSession _session = new();
    private AuthApiClient? _authApi;

    public AppSession Session => _session;

    public event EventHandler? SessionExpired;

    public void BindAuthApi(AuthApiClient authApi)
    {
        _authApi = authApi;
    }

    public bool TryRestoreFromDisk()
    {
        var persisted = SessionStore.Load();
        if (persisted == null)
        {
            return false;
        }

        _session.LoadFrom(persisted);
        return _session.IsAuthenticated;
    }

    public void ApplyLogin(Models.DesktopLoginResponse response, AppMode? lastMode = null)
    {
        _session.ApplyLogin(response, lastMode);
        Persist();
    }

    public void SetLastMode(AppMode mode)
    {
        _session.SetLastMode(mode);
        Persist();
    }

    public void Persist()
    {
        if (!_session.IsAuthenticated)
        {
            return;
        }

        SessionStore.Save(_session.ToPersisted());
    }

    public void Clear()
    {
        _session.Clear();
        SessionStore.Delete();
    }

    public void NotifySessionExpired()
    {
        Clear();
        SessionExpired?.Invoke(this, EventArgs.Empty);
    }

    public async Task EnsureValidAccessTokenAsync(CancellationToken cancellationToken = default)
    {
        if (!_session.IsAuthenticated || _authApi == null)
        {
            return;
        }

        if (!_session.IsAccessTokenExpiringSoon(RefreshThreshold))
        {
            return;
        }

        await RefreshTokensAsync(cancellationToken);
    }

    public async Task<bool> RefreshTokensAsync(CancellationToken cancellationToken = default, bool force = false)
    {
        if (_authApi == null || string.IsNullOrWhiteSpace(_session.RefreshToken))
        {
            return false;
        }

        await _refreshLock.WaitAsync(cancellationToken);
        try
        {
            if (!force
                && !_session.IsAccessTokenExpiringSoon(RefreshThreshold)
                && _session.AccessTokenExpiresAtUtc > DateTimeOffset.UtcNow)
            {
                return true;
            }

            var response = await _authApi.RefreshAsync(_session.RefreshToken, cancellationToken);
            var lastMode = _session.LastMode;
            _session.ApplyLogin(response, lastMode);
            Persist();
            return true;
        }
        catch (ApiException)
        {
            return false;
        }
        finally
        {
            _refreshLock.Release();
        }
    }

    public async Task<bool> RestoreSessionAsync(CancellationToken cancellationToken = default)
    {
        if (!TryRestoreFromDisk() || _authApi == null)
        {
            return false;
        }

        if (_session.IsAccessTokenExpiringSoon(TimeSpan.Zero))
        {
            if (!await RefreshTokensAsync(cancellationToken))
            {
                Clear();
                return false;
            }
        }
        else
        {
            try
            {
                var user = await _authApi.GetMeAsync(_session.AccessToken, cancellationToken);
                _session.ApplyLogin(new Models.DesktopLoginResponse
                {
                    AccessToken = _session.AccessToken,
                    RefreshToken = _session.RefreshToken,
                    ExpiresInSeconds = Math.Max(0, (long)(_session.AccessTokenExpiresAtUtc - DateTimeOffset.UtcNow).TotalSeconds),
                    User = user
                }, _session.LastMode);
                Persist();
            }
            catch (ApiException)
            {
                if (!await RefreshTokensAsync(cancellationToken))
                {
                    Clear();
                    return false;
                }
            }
        }

        return _session.IsAuthenticated;
    }
}
