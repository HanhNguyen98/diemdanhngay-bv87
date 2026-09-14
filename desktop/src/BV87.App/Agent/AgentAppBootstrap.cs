using System.Windows;
using BV87.App.Helpers;
using BV87.App.Services;
using BV87.App.ViewModels.Agent;
using BV87.App.Windows;
using BV87.Core.Api;
using BV87.Core.Config;
using BV87.Core.Constants;
using BV87.Core.Helpers;

namespace BV87.App.Agent;

/// <summary>Bootstraps kiosk agent mode — no JWT login (SPEC §2.22).</summary>
public static class AgentAppBootstrap
{
    public static void Start(Application app)
    {
        var config = AgentConfigLoader.Load(AppContext.BaseDirectory);
        if (string.IsNullOrWhiteSpace(config.KioskToken))
        {
            AppMessageBox.Show(
                AgentUiStrings.MissingKioskToken,
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            app.Shutdown();
            return;
        }

        if (!DesktopLanStartupGuard.EnsureAllowedOrShutdown(
                app, config.ApiBaseUrl, config.LanOnlyEnabled, AgentUiStrings.WindowTitle))
        {
            return;
        }

        DesktopSoundService.SetEnabled(config.SoundEnabled);
        if (!WpfAgentPresence.TryClaimExclusiveForThisProcess())
        {
            AppMessageBox.Show(
                AgentUiStrings.AgentAlreadyRunning,
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            app.Shutdown();
            return;
        }

        WpfUsbShare.ClearAgentYielded();

        var api = KioskApiClient.Create(config.ApiBaseUrl, config.KioskToken);
        var viewModel = new AgentScanViewModel(config, api);
        var window = new AgentScanWindow
        {
            DataContext = viewModel
        };

        app.MainWindow = window;
        window.Show();
        _ = viewModel.InitializeAsync();
    }
}
