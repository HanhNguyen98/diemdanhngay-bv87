using System.Windows;
using BV87.App.Controls;
using BV87.App.Shell;
using BV87.App.Windows;
using BV87.Core.Api;

namespace BV87.App.Branding;

/// <summary>Loads public branding, caches locally, applies to login/shell — SPEC_DESKTOP §2.19.6.</summary>
public sealed class AppBrandingService
{
    private readonly PublicApiClient _publicApi;
    private readonly object _gate = new();
    private AppBrandingState _current = AppBrandingState.Defaults;
    private Task? _loadTask;

    public AppBrandingService(PublicApiClient publicApi)
    {
        _publicApi = publicApi;
        var cached = AppBrandingCache.TryLoad();
        if (cached != null)
        {
            _current = cached;
        }
    }

    public AppBrandingState Current
    {
        get
        {
            lock (_gate)
            {
                return _current;
            }
        }
    }

    public event EventHandler? Changed;

    public Task EnsureLoadedAsync(CancellationToken cancellationToken = default)
    {
        lock (_gate)
        {
            _loadTask ??= LoadInternalAsync(force: false, cancellationToken);
            return _loadTask;
        }
    }

    public async Task ReloadAsync(CancellationToken cancellationToken = default)
    {
        Task task;
        lock (_gate)
        {
            _loadTask = LoadInternalAsync(force: true, cancellationToken);
            task = _loadTask;
        }

        await task;
        ApplyToOpenWindows();
    }

    public void ApplyToOpenWindows()
    {
        if (Application.Current == null)
        {
            return;
        }

        Application.Current.Dispatcher.Invoke(() =>
        {
            var state = Current;
            foreach (Window window in Application.Current.Windows)
            {
                if (WindowBrandingHelper.IsHospitalLogoWindow(window))
                {
                    WindowBrandingHelper.ApplyWindowIcon(window, state);
                }

                switch (window)
                {
                    case LoginWindow login:
                        BrandingUiApplicator.ApplyLogin(login, state);
                        break;
                    case MainShellWindow shell:
                        shell.ApplyBranding(state);
                        break;
                }
            }
        });
    }

    private async Task LoadInternalAsync(bool force, CancellationToken cancellationToken)
    {
        if (!force)
        {
            try
            {
                var dto = await _publicApi.GetBrandingAsync(cancellationToken);
                UpdateCurrent(AppBrandingState.FromDto(dto.PortalTitle, dto.LogoUrl, dto.LoginAvatarUrl));
                return;
            }
            catch
            {
                var cached = AppBrandingCache.TryLoad();
                if (cached != null)
                {
                    UpdateCurrent(cached);
                }

                return;
            }
        }

        try
        {
            var dto = await _publicApi.GetBrandingAsync(cancellationToken);
            UpdateCurrent(AppBrandingState.FromDto(dto.PortalTitle, dto.LogoUrl, dto.LoginAvatarUrl));
        }
        catch
        {
            // keep current (cache or defaults)
        }
    }

    private void UpdateCurrent(AppBrandingState state)
    {
        lock (_gate)
        {
            _current = state;
        }

        AppBrandingCache.Save(state);
        Changed?.Invoke(this, EventArgs.Empty);
    }
}
