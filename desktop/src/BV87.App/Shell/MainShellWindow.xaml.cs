using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using BV87.App.Branding;
using BV87.App.Controls;
using BV87.App.ViewModels;
using BV87.App.Views;
using BV87.App.Views.Admin;
using BV87.App.Views.Admin.Catalog;
using BV87.App.Views.Admin.Utilities;
using BV87.App.Views.Head;
using BV87.App.Views.Settings;
using BV87.Core;
using BV87.Core.Constants;

namespace BV87.App.Shell;

public partial class MainShellWindow : Window
{
    private readonly AppMode _mode;
    private readonly IReadOnlyList<ShellNavGroup> _navGroups;
    private readonly IReadOnlyList<ShellNavItem> _navItems;
    private readonly Dictionary<string, Button> _navButtons = new();
    private readonly Dictionary<Button, string> _buttonNavIds = new();
    private string? _activeNavId;
    private DateOnly? _pendingAttendanceDate;
    private int? _pendingDeptDetailCode;
    private DateOnly? _pendingDeptDetailDate;
    private NotificationBellViewModel? _notificationBellViewModel;

    public MainShellWindow(AppMode mode)
    {
        _mode = mode;
        _navGroups = ShellNavigation.GetNavGroups(mode);
        _navItems = ShellNavigation.GetNavItems(mode);
        InitializeComponent();
        WindowBrandingHelper.ApplyHospitalIcon(this);
        WindowState = WindowState.Maximized;
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        Title = ShellUiStrings.WindowTitle;

        if (_mode == AppMode.Admin || _mode == AppMode.Head)
        {
            var user = App.Sessions.Session.User;
            if (user != null)
            {
                UserInfoText.Text = string.IsNullOrWhiteSpace(user.RoleLabel) ? user.Fullname : user.RoleLabel;
                UserAvatarText.Text = GetInitials(user.Fullname);
            }

            SetupNotificationBell();
        }

        BuildNav();
        if (_navItems.Count > 0)
        {
            NavigateTo(_navItems[0].Id);
        }

        App.Sessions.SetLastMode(_mode);

        BrandingUiApplicator.ApplyShellSidebar(SidebarLogo, App.Branding.Current, _mode, App.Sessions.Session.User);
        WindowBrandingHelper.ApplyWindowIcon(this, App.Branding.Current);
    }

    public void ApplyBranding(AppBrandingState state)
    {
        BrandingUiApplicator.ApplyShellSidebar(SidebarLogo, state, _mode, App.Sessions.Session.User);
        WindowBrandingHelper.ApplyWindowIcon(this, state);
    }

    private void SetupNotificationBell()
    {
        _notificationBellViewModel = new NotificationBellViewModel(App.NotificationApi);
        _notificationBellViewModel.NavigationRequested += OnNotificationNavigationRequested;
        NotificationBellControl.DataContext = _notificationBellViewModel;
        NotificationBellControl.Visibility = Visibility.Visible;
        NotificationSeparator.Visibility = Visibility.Visible;
    }

    private void OnNotificationNavigationRequested(object? sender, NotificationNavigationRequest request)
    {
        if (request.AttendanceDate != null)
        {
            _pendingAttendanceDate = request.AttendanceDate;
        }

        if (_navItems.Any(x => x.Id == request.TargetNavId))
        {
            NavigateTo(request.TargetNavId);
        }
    }

    private void BuildNav()
    {
        NavPanel.Children.Clear();
        _navButtons.Clear();
        _buttonNavIds.Clear();

        foreach (var group in _navGroups)
        {
            if (!string.IsNullOrWhiteSpace(group.Title))
            {
                NavPanel.Children.Add(new TextBlock
                {
                    Text = group.Title.ToUpperInvariant(),
                    FontFamily = (FontFamily)FindResource("AppFontFamily"),
                    FontSize = (double)FindResource("FontSizeSm"),
                    FontWeight = FontWeights.SemiBold,
                    Foreground = (Brush)FindResource("ContentMutedBrush"),
                    Margin = new Thickness(20, 18, 20, 6)
                });
            }

            foreach (var item in group.Items)
            {
                var button = new Button
                {
                    Style = (Style)FindResource("ShellNavButtonStyle"),
                    Content = BuildNavContent(item)
                };
                button.Click += NavButton_Click;
                _navButtons[item.Id] = button;
                _buttonNavIds[button] = item.Id;
                NavPanel.Children.Add(button);
            }
        }
    }

    private static UIElement BuildNavContent(ShellNavItem item)
    {
        var panel = new StackPanel { Orientation = Orientation.Horizontal };
        panel.Children.Add(new TextBlock
        {
            Text = ShellNavIcons.GetGlyph(item.Id),
            FontFamily = new FontFamily("Segoe MDL2 Assets"),
            FontSize = 19,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, 0, 10, 0)
        });
        panel.Children.Add(new TextBlock
        {
            Text = item.Label,
            VerticalAlignment = VerticalAlignment.Center
        });
        return panel;
    }

    private void NavButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button button && _buttonNavIds.TryGetValue(button, out var navId))
        {
            NavigateTo(navId);
        }
    }

    public void NavigateToDeptDetail(int deptCode, DateOnly date)
    {
        _pendingDeptDetailCode = deptCode;
        _pendingDeptDetailDate = date;
        NavigateTo("dashboard-dept");
    }

    private void NavigateTo(string navId)
    {
        var item = _navItems.FirstOrDefault(x => x.Id == navId);
        if (item == null)
        {
            return;
        }

        _activeNavId = navId;
        ContentHost.Content = CreatePage(navId, item, _mode);
        UpdateNavActiveState();
    }

    private object CreatePage(string navId, ShellNavItem item, AppMode mode)
    {
        var pendingDate = navId == "attendance" ? _pendingAttendanceDate : null;
        if (pendingDate != null)
        {
            _pendingAttendanceDate = null;
        }

        var pendingDept = navId == "dashboard-dept" ? _pendingDeptDetailCode : null;
        var pendingDeptDate = navId == "dashboard-dept" ? _pendingDeptDetailDate : null;
        if (navId == "dashboard-dept")
        {
            _pendingDeptDetailCode = null;
            _pendingDeptDetailDate = null;
        }

        return navId switch
        {
            "attendance" => new HeadAttendancePage(pendingDate),
            "statistics" => new HeadStatisticsPage(),
            "dashboard-overview" => new AdminDashboardOverviewPage(),
            "dashboard-dept" => new AdminDeptAttendanceDetailPage(pendingDept, pendingDeptDate),
            "departments" => new DepartmentCatalogPage(),
            "ranks" => new StaffAttributeCatalogPage(StaffAttributeCatalogKind.Rank),
            "positions" => new StaffAttributeCatalogPage(StaffAttributeCatalogKind.Position),
            "statuses" => new AttendanceStatusCatalogPage(),
            "staff" when mode == AppMode.Admin => new StaffCatalogPage(),
            "staff" when mode == AppMode.Head => new HeadStaffFingerprintPage(),
            "unlock-requests" => new UnlockRequestsPage(),
            "reminder-history" => new ReminderHistoryPage(),
            "audit-logs" => new AttendanceAuditLogPage(),
            "fingerprint-history" => new FingerprintHistoryPage(),
            "fingerprint-enroll" => new FingerprintEnrollPage(mode),
            "password" => new ChangePasswordPage(),
            "settings-permissions" => new PermissionsPage(),
            "settings-kiosk" => new KioskTokensPage(),
            "settings-system" => new SystemSettingsPage(),
            _ => new PlaceholderPage(item.PlaceholderTitle, item.PlaceholderDescription)
        };
    }

    private void UpdateNavActiveState()
    {
        foreach (var pair in _navButtons)
        {
            var isActive = pair.Key == _activeNavId;
            pair.Value.Tag = isActive ? "active" : null;
        }
    }

    private void LogoutButton_Click(object sender, RoutedEventArgs e)
    {
        App.Logout();
        App.ShowLogin();
    }

    private static string GetInitials(string fullname)
    {
        if (string.IsNullOrWhiteSpace(fullname))
        {
            return "?";
        }

        var parts = fullname.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 1)
        {
            return parts[0][..1].ToUpperInvariant();
        }

        return $"{char.ToUpperInvariant(parts[0][0])}{char.ToUpperInvariant(parts[^1][0])}";
    }
}
