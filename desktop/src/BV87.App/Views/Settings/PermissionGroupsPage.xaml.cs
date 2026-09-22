using System.Windows;
using System.Windows.Controls;
using BV87.App.Helpers;
using BV87.App.ViewModels.Settings;
using BV87.Core.Constants;

namespace BV87.App.Views.Settings;

public partial class PermissionGroupsPage : UserControl
{
    private PermissionGroupsViewModel? _viewModel;

    public PermissionGroupsPage()
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

        _viewModel = new PermissionGroupsViewModel(App.AdminApi);
        _viewModel.FormRequested += OnFormRequested;
        _viewModel.DeactivateRequested += OnDeactivateRequested;
        DataContext = _viewModel;
    }

    private void OnUnloaded(object sender, RoutedEventArgs e)
    {
        if (_viewModel == null)
        {
            return;
        }

        _viewModel.FormRequested -= OnFormRequested;
        _viewModel.DeactivateRequested -= OnDeactivateRequested;
    }

    private void OnFormRequested(object? sender, PermissionGroupRowViewModel? row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var dialog = new PermissionGroupFormDialog(_viewModel, row) { Owner = Window.GetWindow(this) };
        dialog.ShowDialog();
    }

    private async void OnDeactivateRequested(object? sender, PermissionGroupRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var confirm = MessageBox.Show(
            SettingsUiStrings.PermissionGroups.DeactivateMessage(row.Name),
            SettingsUiStrings.PermissionGroups.DeactivateTitle,
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);
        if (confirm != MessageBoxResult.Yes)
        {
            return;
        }

        try
        {
            await _viewModel.DeactivateAsync(row);
        }
        catch (Exception ex)
        {
            ShellToast.Danger(ex.Message);
        }
    }

    private void ActionsMenuButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button { Tag: PermissionGroupRowViewModel row } button || _viewModel == null)
        {
            return;
        }

        var menu = new ContextMenu();
        menu.Items.Add(CreateMenuItem(
            SettingsUiStrings.Edit,
            () => ExecuteCommand(_viewModel.EditCommand, row)));
        if (row.Active)
        {
            var deactivate = CreateMenuItem(
                SettingsUiStrings.Delete,
                () => ExecuteCommand(_viewModel.DeactivateCommand, row));
            deactivate.Foreground = (System.Windows.Media.Brush)FindResource("DangerFgBrush");
            menu.Items.Add(deactivate);
        }

        menu.PlacementTarget = button;
        menu.IsOpen = true;
    }

    private static MenuItem CreateMenuItem(string header, Action action)
    {
        var item = new MenuItem { Header = header };
        item.Click += (_, _) => action();
        return item;
    }

    private static void ExecuteCommand(System.Windows.Input.ICommand command, object parameter)
    {
        if (command.CanExecute(parameter))
        {
            command.Execute(parameter);
        }
    }
}
