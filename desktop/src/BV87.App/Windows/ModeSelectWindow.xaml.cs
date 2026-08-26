using System.Windows;
using BV87.Core;

namespace BV87.App.Windows;

public partial class ModeSelectWindow : Window
{
    public ModeSelectWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        var user = App.Session.User;
        if (user == null)
        {
            Close();
            new LoginWindow().Show();
            return;
        }

        UserSummaryText.Text = $"{user.Fullname} — {user.RoleLabel}";

        AdminButton.Visibility = user.IsAdmin ? Visibility.Visible : Visibility.Collapsed;
        HeadButton.Visibility = user.IsAdmin || user.IsHead ? Visibility.Visible : Visibility.Collapsed;
    }

    private void AdminButton_Click(object sender, RoutedEventArgs e) => OpenShell(AppMode.Admin);

    private void HeadButton_Click(object sender, RoutedEventArgs e) => OpenShell(AppMode.Head);

    private void KioskButton_Click(object sender, RoutedEventArgs e) => OpenShell(AppMode.Kiosk);

    private void OpenShell(AppMode mode)
    {
        if (mode == AppMode.Admin && App.Session.User?.IsAdmin != true)
        {
            MessageBox.Show(this, "Tài khoản không có quyền Quản trị viên.", "BV87", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (mode == AppMode.Head && App.Session.User is { IsAdmin: false, IsHead: false })
        {
            MessageBox.Show(this, "Tài khoản không có quyền Trưởng đơn vị.", "BV87", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        Close();
        new ShellWindow(mode).Show();
    }
}
