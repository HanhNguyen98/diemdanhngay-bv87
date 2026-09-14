using System.Windows;
using System.Windows.Input;
using BV87.App.Branding;
using BV87.Core;
using BV87.Core.Models;

namespace BV87.App.Windows;

public partial class LoginWindow : Window
{
    private const double WindowHeightDefault = 600;
    private const double WindowHeightWithError = 680;

    public LoginWindow()
    {
        InitializeComponent();
        WindowBrandingHelper.ApplyHospitalIcon(this);
        Loaded += OnLoadedAsync;
        UsernameBox.Focus();
    }

    private async void OnLoadedAsync(object sender, RoutedEventArgs e)
    {
        try
        {
            await App.Branding.EnsureLoadedAsync();
            BrandingUiApplicator.ApplyLogin(this, App.Branding.Current);
        }
        catch
        {
            BrandingUiApplicator.ApplyLogin(this, AppBrandingState.Defaults);
        }
    }

    private async void LoginButton_Click(object sender, RoutedEventArgs e)
    {
        await TryLoginAsync();
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
        ClearError();
        LoginButton.IsEnabled = false;

        try
        {
            var request = new LoginRequest
            {
                Username = UsernameBox.Text.Trim(),
                Password = PasswordField.Password
            };

            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                ShowError("Vui lòng nhập tên đăng nhập và mật khẩu");
                return;
            }

            var response = await App.AuthApi.LoginAsync(request);
            App.Sessions.ApplyLogin(response);
            App.OpenShellAfterLogin();
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

    private void ShowError(string message)
    {
        ErrorText.Text = message;
        ErrorPanel.Visibility = Visibility.Visible;
        Height = WindowHeightWithError;
    }

    private void ClearError()
    {
        ErrorPanel.Visibility = Visibility.Collapsed;
        Height = WindowHeightDefault;
    }
}
