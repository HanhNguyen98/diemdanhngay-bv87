using System.ComponentModel;
using System.Windows;
using System.Windows.Controls;
using BV87.App.ViewModels;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Attendance;

namespace BV87.App.Views.Admin;

public partial class AdminDeptAttendanceDetailPage : UserControl
{
    private readonly int? _initialDeptCode;
    private readonly DateOnly? _initialDate;
    private AdminDeptAttendanceViewModel? _viewModel;

    public AdminDeptAttendanceDetailPage() : this(null, null)
    {
    }

    public AdminDeptAttendanceDetailPage(int? initialDeptCode, DateOnly? initialDate)
    {
        _initialDeptCode = initialDeptCode;
        _initialDate = initialDate;
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        if (DataContext != null)
        {
            return;
        }

        _viewModel = new AdminDeptAttendanceViewModel(
            App.AdminApi,
            App.AttendanceApi,
            _initialDeptCode,
            _initialDate);
        _viewModel.PropertyChanged += OnViewModelPropertyChanged;
        _viewModel.RejectUnlockDialogRequested += OnRejectUnlockDialogRequested;
        DataContext = _viewModel;
        UpdateDeptColumnVisibility();
    }

    private async void OnRejectUnlockDialogRequested(object? sender, EventArgs e)
    {
        var vm = ResolveViewModel();
        if (vm == null)
        {
            return;
        }

        var dialog = new Utilities.UnlockRejectDialog { Owner = Window.GetWindow(this) };
        if (dialog.ShowDialog() != true)
        {
            return;
        }

        await vm.RejectUnlockRequestAsync(dialog.Note);
    }

    private void OnViewModelPropertyChanged(object? sender, PropertyChangedEventArgs args)
    {
        if (args.PropertyName == nameof(AdminDeptAttendanceViewModel.ShowDeptColumn))
        {
            UpdateDeptColumnVisibility();
        }
    }

    private void UpdateDeptColumnVisibility()
    {
        var vm = ResolveViewModel();
        if (vm == null)
        {
            return;
        }

        DeptColumn.Visibility = vm.ShowDeptColumn ? Visibility.Visible : Visibility.Collapsed;
    }

    private AdminDeptAttendanceViewModel? ResolveViewModel()
    {
        if (_viewModel == null && DataContext is AdminDeptAttendanceViewModel vmFromContext)
        {
            _viewModel = vmFromContext;
        }

        return _viewModel;
    }

    private void ActionsMenuButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button button || button.Tag is not StaffAttendanceRow staff)
        {
            return;
        }

        var vm = ResolveViewModel();
        if (vm == null)
        {
            return;
        }

        var menu = new ContextMenu();
        menu.Items.Add(CreateActionItem(AdminUiStrings.DeptDetailScanLogs, () => vm.OpenScanLogs(staff)));
        menu.Items.Add(CreateActionItem(AttendanceUiStrings.ManualScheduleOpenLink, () => vm.OpenManualSchedule(staff)));

        if (AttendanceActionHelper.CanAdminFillTimes(staff))
        {
            menu.Items.Add(CreateActionItem(AdminUiStrings.DeptDetailFillTimesAction, () => vm.OpenFillTimes(staff)));
        }

        if (AttendanceActionHelper.CanAdminApprovePayrollFill(staff))
        {
            menu.Items.Add(CreateActionItem(AdminUiStrings.DeptDetailPayrollApproveAction, () => vm.OpenApprovePayrollFill(staff)));
        }

        if (AttendanceActionHelper.CanClearAttendance(staff))
        {
            menu.Items.Add(CreateActionItem(AdminUiStrings.DeptDetailClearAction, () => vm.OpenClearAttendance(staff)));
        }

        menu.PlacementTarget = button;
        menu.IsOpen = true;
    }

    private static MenuItem CreateActionItem(string header, Action action)
    {
        var item = new MenuItem { Header = header };
        item.Click += (_, _) => action();
        return item;
    }
}
