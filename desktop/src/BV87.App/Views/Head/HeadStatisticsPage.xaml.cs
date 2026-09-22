using System.Windows;
using System.Windows.Controls;
using BV87.App.Helpers;
using BV87.App.ViewModels;
using BV87.Core.Constants;

namespace BV87.App.Views.Head;

public partial class HeadStatisticsPage : UserControl
{
    private HeadStatisticsViewModel? _viewModel;

    public HeadStatisticsPage()
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

        var user = App.Sessions.Session.User;
        if (user?.DeptCode == null)
        {
            Content = new PlaceholderPage(
                "Thống kê",
                "Tài khoản không gắn đơn vị. Chỉ tài khoản Trưởng đơn vị mới sử dụng màn Thống kê.");
            return;
        }

        _viewModel = new HeadStatisticsViewModel(App.AttendanceApi, user.DeptCode.Value, user.DeptName);
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
            _viewModel.WriteExport);
    }
}
