using System.Windows;
using BV87.App.Shell;
using BV87.App.ViewModels.Settings;
using BV87.Core.Constants;

namespace BV87.App.Views.Settings;

public partial class ResetPasswordDialog : AppDialogWindow
{
    private readonly PermissionsViewModel _ownerVm;
    private readonly AccountRowViewModel _account;

    public ResetPasswordDialog(PermissionsViewModel ownerVm, AccountRowViewModel account)
    {
        _ownerVm = ownerVm;
        _account = account;
        InitializeComponent();
        DescText.Text = SettingsUiStrings.Accounts.ResetPasswordDesc(_account.Fullname, _account.Username);
    }

    private async void Save_Click(object sender, RoutedEventArgs e)
    {
        ErrorText.Visibility = Visibility.Collapsed;
        SaveButton.IsEnabled = false;

        try
        {
            var newPassword = NewPasswordBox.Password;
            var confirm = ConfirmPasswordBox.Password;

            if (newPassword.Length < 6)
            {
                ShowError(SettingsUiStrings.Accounts.ResetPasswordMinLength);
                return;
            }

            if (newPassword != confirm)
            {
                ShowError(SettingsUiStrings.Accounts.ResetPasswordMismatch);
                return;
            }

            await _ownerVm.ResetPasswordAsync(_account.Id, newPassword, confirm, _account.Username);
            DialogResult = true;
            Close();
        }
        catch (Exception ex)
        {
            ShowError(ex.Message);
        }
        finally
        {
            SaveButton.IsEnabled = true;
        }
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void ShowError(string message)
    {
        ErrorText.Text = message;
        ErrorText.Visibility = Visibility.Visible;
    }
}
