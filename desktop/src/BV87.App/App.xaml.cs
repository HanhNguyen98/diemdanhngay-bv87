using System.Windows;
using BV87.App.Agent;
using BV87.App.Branding;
using BV87.App.Helpers;
using BV87.App.Shell;
using BV87.App.Toasts;
using BV87.App.Views;
using BV87.App.Views.Head;
using BV87.App.Windows;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Config;
using BV87.Core.Models;
using BV87.Core.Session;

namespace BV87.App;

public partial class App : Application
{
    public static AppConfig Config { get; private set; } = new();
    public static SessionManager Sessions { get; private set; } = new();
    public static AuthApiClient AuthApi { get; private set; } = null!;
    public static Bv87ApiClient Api { get; private set; } = null!;
    public static AttendanceApiClient AttendanceApi { get; private set; } = null!;
    public static AdminApiClient AdminApi { get; private set; } = null!;
    public static HeadApiClient HeadApi { get; private set; } = null!;
    public static NotificationApiClient NotificationApi { get; private set; } = null!;
    public static AppBrandingService Branding { get; private set; } = null!;
    public static ToastService Toasts { get; private set; } = new();
    public static AppMode? CliMode { get; private set; }

    protected override void OnStartup(StartupEventArgs e)
    {
        AppUiCulture.Apply();
        EventManager.RegisterClassHandler(
            typeof(Window),
            FrameworkElement.LoadedEvent,
            new RoutedEventHandler(ApplyWindowIconOnLoaded));
        base.OnStartup(e);

        if (IsAgentMode(e.Args))
        {
            ShutdownMode = ShutdownMode.OnMainWindowClose;
            AgentAppBootstrap.Start(this);
            return;
        }

        ShutdownMode = ShutdownMode.OnExplicitShutdown;

        Config = ConfigLoader.Load(AppContext.BaseDirectory);
        if (!DesktopLanStartupGuard.EnsureAllowedOrShutdown(this, Config.ApiBaseUrl, Config.LanOnlyEnabled, "BV87"))
        {
            return;
        }

        Sessions = new SessionManager();
        Toasts = new ToastService();
        AuthApi = Bv87HttpClientFactory.CreateAuthClient(Config.ApiBaseUrl);
        Api = Bv87HttpClientFactory.CreateApiClient(Config.ApiBaseUrl, Sessions);
        AttendanceApi = new AttendanceApiClient(Api);
        AdminApi = new AdminApiClient(Api);
        HeadApi = new HeadApiClient(Api);
        NotificationApi = new NotificationApiClient(Api);
        Branding = new AppBrandingService(Bv87HttpClientFactory.CreatePublicClient(Config.ApiBaseUrl));
        Sessions.BindAuthApi(AuthApi);
        Sessions.SessionExpired += (_, _) => Dispatcher.Invoke(ShowLogin);

        AppDomain.CurrentDomain.UnhandledException += (_, args) =>
        {
            var text = args.ExceptionObject?.ToString() ?? "unknown";
            Hardware.FingerprintTraceLog.Write("FATAL UnhandledException", text);
            AppMessageBox.Show(
                text.Length > 800 ? text[..800] + "…" : text,
                MessageBoxButton.OK,
                MessageBoxImage.Error);
        };

        DispatcherUnhandledException += (_, args) =>
        {
            AppMessageBox.Show(
                args.Exception.Message,
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            args.Handled = true;
            ShowLogin();
        };

        CliMode = ParseCliMode(e.Args);

        ShowLogin();
        _ = Branding.EnsureLoadedAsync();
    }

    public static void ShowLogin()
    {
        RunOnUiThread(() =>
        {
            if (TryCreateWindow(() => new LoginWindow(), out var login))
            {
                CloseOtherWindows(login);
                login.Show();
                login.Activate();
                Current.MainWindow = login;
            }
        });
    }

    public static void OpenMainShell(AppMode mode)
    {
        RunOnUiThread(() =>
        {
            if (!TryCreateWindow(() => new MainShellWindow(mode), out var shell))
            {
                return;
            }

            shell.WindowState = WindowState.Maximized;
            CloseOtherWindows(shell);
            shell.Show();
            shell.Activate();
            Current.MainWindow = shell;
        });
    }

    private static bool TryCreateWindow<T>(Func<T> factory, out T window) where T : Window
    {
        try
        {
            window = factory();
            return true;
        }
        catch (Exception ex)
        {
            window = null!;
            AppMessageBox.Show(
                $"Không mở được giao diện: {ex.Message}",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            return false;
        }
    }

    private static void CloseOtherWindows(Window keepOpen)
    {
        foreach (Window window in Current.Windows.Cast<Window>().ToList())
        {
            if (!ReferenceEquals(window, keepOpen))
            {
                window.Close();
            }
        }
    }

    private static void RunOnUiThread(Action action)
    {
        if (Current.Dispatcher.CheckAccess())
        {
            action();
            return;
        }

        Current.Dispatcher.Invoke(action);
    }

    public static void Logout()
    {
        Sessions.Clear();
    }

    public static void OpenShellAfterLogin()
    {
        if (CliMode is AppMode headOrAdmin)
        {
            OpenMainShell(headOrAdmin);
            return;
        }

        OpenShellForCurrentUser();
    }

    public static void OpenShellForCurrentUser()
    {
        var user = Sessions.Session.User;
        if (user == null)
        {
            ShowLogin();
            return;
        }

        var mode = ResolveDefaultMode(user);
        if (mode == null)
        {
            AppMessageBox.Show(
                "Tài khoản không có quyền Trưởng đơn vị, Trực ban hoặc Quản trị viên.",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            ShowLogin();
            return;
        }

        OpenMainShell(mode.Value);
    }

    internal static AppMode? ResolveDefaultMode(UserProfile user)
    {
        if (user.IsAdmin)
        {
            return AppMode.Admin;
        }

        if (user.IsDuty)
        {
            return AppMode.Duty;
        }

        if (user.IsHead)
        {
            return AppMode.Head;
        }

        return null;
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
                "head" => AppMode.Head,
                "admin" => AppMode.Admin,
                "duty" => AppMode.Duty,
                _ => null
            };
        }

        return null;
    }

    private static bool IsAgentMode(string[] args) =>
        args.Any(arg => string.Equals(arg, "--agent", StringComparison.OrdinalIgnoreCase));

    private static void ApplyWindowIconOnLoaded(object sender, RoutedEventArgs e)
    {
        if (sender is Window window)
        {
            WindowBrandingHelper.ApplyForWindow(window);
        }
    }
}
