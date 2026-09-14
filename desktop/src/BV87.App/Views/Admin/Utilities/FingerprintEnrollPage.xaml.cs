using System.Windows;
using System.Windows.Controls;
using BV87.App.Helpers;
using BV87.App.ViewModels.Utilities;
using BV87.Core;
using BV87.Core.Constants;

namespace BV87.App.Views.Admin.Utilities;

public partial class FingerprintEnrollPage : UserControl
{
    private readonly AppMode _mode;
    private FingerprintEnrollViewModel? _viewModel;

    public FingerprintEnrollPage(AppMode mode)
    {
        _mode = mode;
        InitializeComponent();
        Loaded += OnLoaded;
        Unloaded += OnUnloaded;
    }

    public FingerprintEnrollPage() : this(AppMode.Admin)
    {
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        if (DataContext != null)
        {
            return;
        }

        _viewModel = _mode == AppMode.Admin
            ? new FingerprintEnrollViewModel(AppMode.Admin, App.AdminApi, null)
            : new FingerprintEnrollViewModel(AppMode.Head, null, App.HeadApi);

        _viewModel.FingerLabelRequired += OnFingerLabelRequired;
        _viewModel.EnrollCompleted += OnEnrollCompleted;
        _viewModel.EnrollFailed += OnEnrollFailed;
        DataContext = _viewModel;
    }

    private void OnUnloaded(object sender, RoutedEventArgs e)
    {
        if (_viewModel != null)
        {
            _viewModel.FingerLabelRequired -= OnFingerLabelRequired;
            _viewModel.EnrollCompleted -= OnEnrollCompleted;
            _viewModel.EnrollFailed -= OnEnrollFailed;
            _viewModel.Dispose();
            _viewModel = null;
        }
    }

    private void StartEnrollButton_Click(object sender, RoutedEventArgs e)
    {
        if (_viewModel == null)
        {
            return;
        }

        if (!_viewModel.CanStartEnroll)
        {
            _viewModel.NotifyStartBlocked();
            return;
        }

        if (_viewModel.SelectedStaff == null)
        {
            _viewModel.NotifyStartBlocked();
            return;
        }

        if (_viewModel.SelectedStaff.Registered)
        {
            var confirm = AppMessageBox.Show(
                UtilitiesUiStrings.FingerprintEnroll.OverwriteMessage(
                    _viewModel.SelectedStaff.Fullname,
                    _viewModel.SelectedStaff.FingerLabel),
                MessageBoxButton.YesNo,
                MessageBoxImage.Warning);
            if (confirm != MessageBoxResult.Yes)
            {
                return;
            }
        }

        _viewModel.StartEnrollCommand.Execute(null);
    }

    private void OnFingerLabelRequired(object? sender, EventArgs e)
    {
        if (_viewModel == null)
        {
            return;
        }

        var dialog = new FingerLabelDialog
        {
            Owner = Window.GetWindow(this)
        };

        if (dialog.ShowDialog() == true && !string.IsNullOrWhiteSpace(dialog.FingerLabel))
        {
            _ = _viewModel.SubmitFingerLabelAsync(dialog.FingerLabel);
        }
        else
        {
            _viewModel.CancelPendingEnroll();
        }
    }

    private void OnEnrollCompleted(object? sender, FingerprintEnrollCompletedEventArgs e)
    {
        AppMessageBox.Show(
            e.Message,
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void OnEnrollFailed(object? sender, FingerprintEnrollFailedEventArgs e)
    {
        AppMessageBox.Show(
            UtilitiesUiStrings.FingerprintEnroll.EnrollFailedDetail(e.Message),
            MessageBoxButton.OK,
            MessageBoxImage.Warning);
    }
}
