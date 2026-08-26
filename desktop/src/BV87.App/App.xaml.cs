using System.Net.Http;
using System.Windows;
using BV87.App.Windows;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Config;
using BV87.Core.Session;

namespace BV87.App;

public partial class App : Application
{
    public static AppConfig Config { get; private set; } = new();
    public static AppSession Session { get; } = new();
    public static AuthApiClient AuthApi { get; private set; } = null!;
    public static AppMode? CliMode { get; private set; }

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        Config = ConfigLoader.Load(AppContext.BaseDirectory);
        var baseUrl = Config.ApiBaseUrl.TrimEnd('/');
        var httpClient = new HttpClient { BaseAddress = new Uri(baseUrl + "/") };
        AuthApi = new AuthApiClient(httpClient);
        CliMode = ParseCliMode(e.Args);

        if (CliMode == AppMode.Kiosk)
        {
            new ShellWindow(AppMode.Kiosk).Show();
            return;
        }

        new LoginWindow().Show();
    }

    public static void OpenModeSelectOrShell()
    {
        if (CliMode is AppMode headOrAdmin && headOrAdmin != AppMode.Kiosk)
        {
            new ShellWindow(headOrAdmin).Show();
            return;
        }

        new ModeSelectWindow().Show();
    }

    private static AppMode? ParseCliMode(string[] args)
    {
        foreach (var arg in args)
        {
            if (!arg.StartsWith("--mode=", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var value = arg["--mode=".Length..].Trim().ToLowerInvariant();
            return value switch
            {
                "kiosk" => AppMode.Kiosk,
                "head" => AppMode.Head,
                "admin" => AppMode.Admin,
                _ => null
            };
        }

        return null;
    }
}
