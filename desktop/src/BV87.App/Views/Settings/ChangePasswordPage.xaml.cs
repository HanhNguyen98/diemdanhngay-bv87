using System.Windows;
using System.Windows.Controls;
using BV87.App.ViewModels.Settings;

namespace BV87.App.Views.Settings;

public partial class ChangePasswordPage : UserControl
{
    private ChangePasswordViewModel? _viewModel;

    public ChangePasswordPage()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        if (DataContext is ChangePasswordViewModel existing)
        {
            _viewModel = existing;
            return;
        }

        var user = App.Sessions.Session.User;
        _viewModel = new ChangePasswordViewModel(
            App.Api,
            App.AdminApi,
            user?.IsAdmin == true,
            user?.IsHead == true ? user.DeptName : null);
        DataContext = _viewModel;
    }

    private async void SubmitButton_Click(object sender, RoutedEventArgs e)
    {
        if (_viewModel == null)
        {
            return;
        }

        SubmitButton.IsEnabled = false;
        try
        {
            var ok = await _viewModel.SubmitAsync(
                NewPasswordField.Password,
                ConfirmPasswordField.Password);
            if (ok)
            {
                NewPasswordField.Clear();
                ConfirmPasswordField.Clear();
            }
        }
        finally
        {
            SubmitButton.IsEnabled = true;
        }
    }

    private async void AdminResetButton_Click(object sender, RoutedEventArgs e)
    {
        if (_viewModel == null)
        {
            return;
        }

        AdminResetButton.IsEnabled = false;
        try
        {
            var ok = await _viewModel.ResetUserPasswordAsync(
                AdminNewPasswordField.Password,
                AdminConfirmPasswordField.Password);
            if (ok)
            {
                AdminNewPasswordField.Clear();
                AdminConfirmPasswordField.Clear();
            }
        }
        finally
        {
            AdminResetButton.IsEnabled = true;
        }
    }
}
