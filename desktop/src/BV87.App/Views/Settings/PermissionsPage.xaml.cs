using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.App.ViewModels.Settings;
using BV87.Core.Constants;
using BV87.Core.Helpers;

namespace BV87.App.Views.Settings;

public partial class PermissionsPage : UserControl
{
    private PermissionsViewModel? _viewModel;

    public PermissionsPage()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        if (DataContext != null)
        {
            return;
        }

        _viewModel = new PermissionsViewModel(App.AdminApi);
        _viewModel.FormRequested += OnFormRequested;
        _viewModel.ResetPasswordRequested += OnResetPasswordRequested;
        _viewModel.DeleteRequested += OnDeleteRequested;
        DataContext = _viewModel;
    }

    private void OnFormRequested(object? sender, AccountRowViewModel? row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var dialog = new AccountFormDialog(_viewModel, row) { Owner = Window.GetWindow(this) };
        dialog.ShowDialog();
    }

    private void OnResetPasswordRequested(object? sender, AccountRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var dialog = new ResetPasswordDialog(_viewModel, row) { Owner = Window.GetWindow(this) };
        dialog.ShowDialog();
    }

    private async void OnDeleteRequested(object? sender, AccountRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        if (row.Id == _viewModel.CurrentAccountId)
        {
            ShellToast.Warning("Cảnh báo: không thể xóa tài khoản đang đăng nhập.");
            return;
        }

        var result = AppMessageBox.Show(
            SettingsUiStrings.Accounts.DeleteMessage(row.Username),
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (result != MessageBoxResult.Yes)
        {
            return;
        }

        try
        {
            await _viewModel.DeleteAccountAsync(row);
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.FailItem("xóa", ToastCopy.Account(row.Username)));
        }
    }

    private void ActionsMenuButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button { Tag: AccountRowViewModel row } button || _viewModel == null)
        {
            return;
        }

        var menu = new ContextMenu();
        menu.Items.Add(CreateMenuItem(
            SettingsUiStrings.Accounts.ResetPasswordAction,
            () => ExecuteCommand(_viewModel.ResetPasswordCommand, row)));
        menu.Items.Add(CreateMenuItem(
            SettingsUiStrings.Edit,
            () => ExecuteCommand(_viewModel.EditCommand, row)));
        var delete = CreateMenuItem(
            SettingsUiStrings.Delete,
            () => ExecuteCommand(_viewModel.DeleteCommand, row));
        delete.Foreground = (System.Windows.Media.Brush)FindResource("DangerFgBrush");
        menu.Items.Add(delete);
        menu.PlacementTarget = button;
        menu.IsOpen = true;
    }

    private static MenuItem CreateMenuItem(string header, Action action)
    {
        var item = new MenuItem { Header = header };
        item.Click += (_, _) => action();
        return item;
    }

    private static void ExecuteCommand(ICommand command, AccountRowViewModel row)
    {
        if (command.CanExecute(row))
        {
            command.Execute(row);
        }
    }
}
