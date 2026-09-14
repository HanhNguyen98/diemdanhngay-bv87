using System.Windows;
using BV87.App.Helpers;
using BV87.Core.Security;

namespace BV87.App;

/// <summary>Shared LAN gate before desktop or agent UI starts (SPEC §1.1).</summary>
internal static class DesktopLanStartupGuard
{
    public static bool EnsureAllowedOrShutdown(Application app, string apiBaseUrl, bool lanOnlyEnabled, string windowTitle)
    {
        var error = LanEndpointGuard.ValidateApiBaseUrl(apiBaseUrl, lanOnlyEnabled);
        if (error == null)
        {
            return true;
        }

        AppMessageBox.Show(
            error,
            MessageBoxButton.OK,
            MessageBoxImage.Warning);
        app.Shutdown();
        return false;
    }
}
