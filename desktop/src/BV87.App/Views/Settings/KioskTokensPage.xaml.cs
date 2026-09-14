using System.Windows;
using System.Windows.Controls;
using BV87.App.Helpers;
using BV87.App.ViewModels.Settings;
using BV87.Core.Constants;
using BV87.Core.Helpers;

namespace BV87.App.Views.Settings;

public partial class KioskTokensPage : UserControl
{
    private KioskTokensViewModel? _viewModel;

    public KioskTokensPage()
    {
        InitializeComponent();
        Loaded += OnLoaded;
        Unloaded += OnUnloaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        if (DataContext != null)
        {
            return;
        }

        _viewModel = new KioskTokensViewModel(App.AdminApi);
        _viewModel.IssueRequested += OnIssueRequested;
        DataContext = _viewModel;
        _viewModel.StartPolling();
    }

    private void OnUnloaded(object sender, RoutedEventArgs e)
    {
        _viewModel?.StopPolling();
    }

    private async void OnIssueRequested(object? sender, EventArgs e)
    {
        if (_viewModel == null)
        {
            return;
        }

        try
        {
            var departments = await _viewModel.LoadDepartmentsAsync();
            var dialog = new KioskTokenIssueDialog(departments) { Owner = Window.GetWindow(this) };
            if (dialog.ShowDialog() != true || dialog.SelectedDeptCode == null)
            {
                return;
            }

            var token = await _viewModel.IssueTokenAsync(dialog.SelectedDeptCode.Value, dialog.LabelText);
            if (!string.IsNullOrWhiteSpace(token))
            {
                new KioskTokenIssuedDialog(token) { Owner = Window.GetWindow(this) }.ShowDialog();
            }
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.FailItem("phát hành", "token kiosk"));
        }
    }

    private void ActionsButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button { Tag: KioskTokenRowViewModel row } button || _viewModel == null || !row.Active)
        {
            return;
        }

        var menu = new ContextMenu();
        menu.Items.Add(CreateMenuItem(SettingsUiStrings.KioskTokens.RenameLabel, () => RenameRow(row)));
        menu.Items.Add(CreateMenuItem(SettingsUiStrings.KioskTokens.Rotate, () => RotateRow(row)));
        var revoke = CreateMenuItem(SettingsUiStrings.KioskTokens.Revoke, () => RevokeRow(row));
        revoke.Foreground = (System.Windows.Media.Brush)FindResource("DangerFgBrush");
        menu.Items.Add(revoke);
        menu.PlacementTarget = button;
        menu.IsOpen = true;
    }

    private static MenuItem CreateMenuItem(string header, Action action)
    {
        var item = new MenuItem { Header = header };
        item.Click += (_, _) => action();
        return item;
    }

    private void RenameRow(KioskTokenRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var dialog = new KioskTokenLabelDialog(row.Dto.Label) { Owner = Window.GetWindow(this) };
        if (dialog.ShowDialog() != true)
        {
            return;
        }

        _ = RunSafe("cập nhật", "nhãn", row.Dto.Label, () => _viewModel.RenameAsync(row.Id, dialog.Label));
    }

    private void RotateRow(KioskTokenRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var confirm = AppMessageBox.Show(
            SettingsUiStrings.KioskTokens.ConfirmRotate,
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);
        if (confirm != MessageBoxResult.Yes)
        {
            return;
        }

        _ = RunSafe("xoay", "token", row.Dto.Label, async () =>
        {
            var token = await _viewModel.RotateAsync(row.Id);
            if (!string.IsNullOrWhiteSpace(token))
            {
                new KioskTokenIssuedDialog(token) { Owner = Window.GetWindow(this) }.ShowDialog();
            }
        });
    }

    private void RevokeRow(KioskTokenRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var confirm = AppMessageBox.Show(
            SettingsUiStrings.KioskTokens.ConfirmRevoke,
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);
        if (confirm != MessageBoxResult.Yes)
        {
            return;
        }

        _ = RunSafe("thu hồi", "token", row.Dto.Label, () => _viewModel.RevokeAsync(row.Id));
    }

    private async Task RunSafe(string verb, string content, string? kioskLabel, Func<Task> action)
    {
        if (_viewModel == null)
        {
            return;
        }

        try
        {
            await action();
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.Fail(verb, content, ToastCopy.Kiosk(kioskLabel)));
        }
    }
}
