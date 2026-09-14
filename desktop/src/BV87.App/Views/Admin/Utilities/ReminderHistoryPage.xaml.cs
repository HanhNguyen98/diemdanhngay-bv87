using System.Windows;
using System.Windows.Controls;
using BV87.App.Helpers;
using BV87.App.ViewModels.Utilities;
using BV87.Core.Constants;

namespace BV87.App.Views.Admin.Utilities;

public partial class ReminderHistoryPage : UserControl
{
    private ReminderHistoryViewModel? _viewModel;

    public ReminderHistoryPage()
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

        _viewModel = new ReminderHistoryViewModel(App.AdminApi);
        _viewModel.ExportRequested += OnExportRequested;
        DataContext = _viewModel;
    }

    private void OnExportRequested(object? sender, EventArgs e)
    {
        if (_viewModel == null)
        {
            return;
        }

        ExcelSaveHelper.SaveExcelFile(
            Window.GetWindow(this),
            _viewModel.ExportFilename,
            ExcelUiStrings.Export,
            _viewModel.ExportExcel);
    }
}
