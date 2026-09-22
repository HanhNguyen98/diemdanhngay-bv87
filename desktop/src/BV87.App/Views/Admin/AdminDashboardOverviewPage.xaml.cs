using System.Windows;
using System.Windows.Controls;
using BV87.App.Shell;
using BV87.App.ViewModels;
using BV87.Core.Constants;
using BV87.Core.Models.Admin;

namespace BV87.App.Views.Admin;

public partial class AdminDashboardOverviewPage : UserControl
{
    private AdminDashboardViewModel? _viewModel;

    public AdminDashboardOverviewPage()
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

        _viewModel = new AdminDashboardViewModel(App.AdminApi);
        _viewModel.ReminderRequested += OnReminderRequested;
        _viewModel.DeptDetailRequested += OnDeptDetailRequested;
        DataContext = _viewModel;
    }

    private void OnDeptDetailRequested(object? sender, DeptDetailNavigationRequest e)
    {
        if (Window.GetWindow(this) is MainShellWindow shell)
        {
            shell.NavigateToDeptDetail(e.DeptCode, e.Date);
        }
    }

    private async void OnReminderRequested(object? sender, EventArgs e)
    {
        if (_viewModel == null)
        {
            return;
        }

        var items = _viewModel.RemindableDepts
            .Where(d => d.DeptCode != null)
            .Select(d => new ReminderDeptItem(d.DeptCode!.Value, d.DisplayName, d.HasActiveHeadAccount, true))
            .ToList();

        if (items.Count == 0)
        {
            return;
        }

        var owner = Window.GetWindow(this);
        var dialog = new ReminderDialog(items, _viewModel.AppliedDate) { Owner = owner };
        if (dialog.ShowDialog() != true)
        {
            return;
        }

        await _viewModel.SendRemindersAsync(dialog.SelectedDeptCodes);
    }

    private void ManageButton_Click(object sender, RoutedEventArgs e)
    {
        if (_viewModel == null || sender is not Button { Tag: DeptProgressSummary dept })
        {
            return;
        }

        var lockLabel = _viewModel.GetLockActionLabel(dept);
        var reportLabel = _viewModel.GetReportBlockActionLabel(dept);
        var canReport = _viewModel.CanToggleReportBlock(dept);

        var menu = new ContextMenu();
        var viewItem = new MenuItem { Header = AdminUiStrings.ViewDeptDetail, Tag = dept };
        viewItem.Click += (_, _) =>
        {
            if (_viewModel.OpenDeptDetailCommand.CanExecute(dept))
            {
                _viewModel.OpenDeptDetailCommand.Execute(dept);
            }
        };
        menu.Items.Add(viewItem);
        menu.Items.Add(new Separator());

        var lockItem = new MenuItem { Header = lockLabel, Tag = dept };
        lockItem.Click += (_, _) =>
        {
            if (_viewModel.ToggleDeptLockCommand.CanExecute(dept))
            {
                _viewModel.ToggleDeptLockCommand.Execute(dept);
            }
        };
        menu.Items.Add(lockItem);

        var reportItem = new MenuItem { Header = reportLabel, Tag = dept, IsEnabled = canReport };
        reportItem.Click += (_, _) =>
        {
            if (_viewModel.ToggleReportBlockCommand.CanExecute(dept))
            {
                _viewModel.ToggleReportBlockCommand.Execute(dept);
            }
        };
        menu.Items.Add(reportItem);

        if (sender is Button button)
        {
            menu.PlacementTarget = button;
            menu.Placement = System.Windows.Controls.Primitives.PlacementMode.Bottom;
            menu.IsOpen = true;
        }
    }
}
