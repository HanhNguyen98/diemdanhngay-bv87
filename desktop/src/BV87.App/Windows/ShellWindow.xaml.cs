using System.Windows;
using BV87.Core;

namespace BV87.App.Windows;

public partial class ShellWindow : Window
{
    private readonly AppMode _mode;

    public ShellWindow(AppMode mode)
    {
        _mode = mode;
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        var (title, description) = _mode switch
        {
            AppMode.Kiosk => ("Kiosk vân tay", "Chế độ quét và đăng ký vân tay tại PC khoa. Cấu hình X-Kiosk-Token trong appsettings.json (phase D1)."),
            AppMode.Head => ("Trưởng đơn vị", "Chấm công, thống kê và danh mục nhân viên theo phạm vi đơn vị (phase D2)."),
            AppMode.Admin => ("Quản trị viên", "Bảng điều khiển và quản trị toàn viện (phase D3–D4)."),
            _ => ("BV87", string.Empty)
        };

        Title = $"BV87 — {title}";
        HeaderTitle.Text = $"BV87 — {title}";
        ModeTitleText.Text = title;
        ModeDescriptionText.Text = description;

        var user = App.Session.User;
        UserInfoText.Text = _mode == AppMode.Kiosk
            ? "Kiosk (token)"
            : user != null
                ? $"{user.Fullname} ({user.RoleLabel})"
                : string.Empty;
    }

    private void LogoutButton_Click(object sender, RoutedEventArgs e)
    {
        App.Session.Clear();
        Close();
        new LoginWindow().Show();
    }
}
