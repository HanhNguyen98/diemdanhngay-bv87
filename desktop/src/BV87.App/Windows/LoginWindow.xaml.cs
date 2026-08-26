using System.Windows;
using System.Windows.Input;
using BV87.Core;
using BV87.Core.Models;

namespace BV87.App.Windows;

public partial class LoginWindow : Window
{
    public LoginWindow()
    {
        InitializeComponent();
        UsernameBox.Focus();
    }

    private async void LoginButton_Click(object sender, RoutedEventArgs e)
    {
        await TryLoginAsync();
    }

    private void KioskButton_Click(object sender, RoutedEventArgs e)
    {
        OpenKioskShell();
    }

    protected override void OnKeyDown(KeyEventArgs e)
    {
        if (e.Key == Key.Enter)
        {
            _ = TryLoginAsync();
        }

        base.OnKeyDown(e);
    }

    private async Task TryLoginAsync()
    {
        ErrorText.Visibility = Visibility.Collapsed;
        LoginButton.IsEnabled = false;

        try
        {
            var request = new LoginRequest
            {
                Username = UsernameBox.Text.Trim(),
                Password = PasswordBox.Password
            };

            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                ShowError("Vui lòng nhập tên đăng nhập và mật khẩu");
                return;
            }

            var response = await App.AuthApi.LoginAsync(request);
            App.Session.ApplyLogin(response);
            Close();
            App.OpenModeSelectOrShell();
        }
        catch (ApiException ex)
        {
            ShowError(ex.Message);
        }
        catch (Exception)
        {
            ShowError("Không kết nối được máy chủ. Kiểm tra ApiBaseUrl trong appsettings.json");
        }
        finally
        {
            LoginButton.IsEnabled = true;
        }
    }

    private static void OpenKioskShell()
    {
        var shell = new ShellWindow(AppMode.Kiosk);
        shell.Show();
        foreach (Window window in Application.Current.Windows)
        {
            if (window is LoginWindow loginWindow)
            {
                loginWindow.Close();
                break;
            }
        }
    }

    private void ShowError(string message)
    {
        ErrorText.Text = message;
        ErrorText.Visibility = Visibility.Visible;
    }
}
