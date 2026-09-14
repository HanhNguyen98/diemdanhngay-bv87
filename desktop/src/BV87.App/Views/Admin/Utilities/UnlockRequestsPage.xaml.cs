using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using BV87.App.ViewModels.Utilities;
using BV87.Core.Constants;

namespace BV87.App.Views.Admin.Utilities;

public partial class UnlockRequestsPage : UserControl
{
    private UnlockRequestsViewModel? _viewModel;

    public UnlockRequestsPage()
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

        _viewModel = new UnlockRequestsViewModel(App.AdminApi);
        _viewModel.RejectRequested += OnRejectRequested;
        DataContext = _viewModel;
    }

    private async void OnRejectRequested(object? sender, UnlockRequestRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var dialog = new UnlockRejectDialog { Owner = Window.GetWindow(this) };
        if (dialog.ShowDialog() != true)
        {
            return;
        }

        await _viewModel.RejectAsync(row, dialog.Note);
    }

    private void ActionsMenuButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button { Tag: UnlockRequestRowViewModel row } button || _viewModel == null)
        {
            return;
        }

        var menu = new ContextMenu();
        var approve = CreateMenuItem(
            UtilitiesUiStrings.UnlockRequests.Approve,
            () => ExecuteCommand(_viewModel.ApproveCommand, row));
        approve.IsEnabled = _viewModel.ApproveCommand.CanExecute(row);
        menu.Items.Add(approve);

        var reject = CreateMenuItem(
            UtilitiesUiStrings.UnlockRequests.Reject,
            () => ExecuteCommand(_viewModel.RejectCommand, row));
        reject.Foreground = (System.Windows.Media.Brush)FindResource("DangerFgBrush");
        reject.IsEnabled = _viewModel.RejectCommand.CanExecute(row);
        menu.Items.Add(reject);

        menu.PlacementTarget = button;
        menu.IsOpen = true;
    }

    private static MenuItem CreateMenuItem(string header, Action action)
    {
        var item = new MenuItem { Header = header };
        item.Click += (_, _) => action();
        return item;
    }

    private static void ExecuteCommand(ICommand command, UnlockRequestRowViewModel row)
    {
        if (command.CanExecute(row))
        {
            command.Execute(row);
        }
    }
}
