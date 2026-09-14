using System.Collections.ObjectModel;
using System.Windows;
using BV87.App.Shell;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Attendance;

namespace BV87.App.Views.Admin;

public partial class ScanLogDialog : AppDialogWindow
{
    private readonly AttendanceApiClient _attendanceApi;
    private readonly StaffAttendanceRow _staff;
    private readonly DateOnly _date;
    private int _page = 1;
    private int _totalPages = 1;

    public ScanLogDialog(AttendanceApiClient attendanceApi, StaffAttendanceRow staff, DateOnly date)
    {
        InitializeComponent();
        _attendanceApi = attendanceApi;
        _staff = staff;
        _date = date;

        TitleText.Text = AdminUiStrings.ScanLogTitle;
        SubtitleText.Text = $"{staff.Fullname} · {staff.EmpCodeFormatted ?? staff.EmpCode.ToString()}";
        ItemsGrid.ItemsSource = new ObservableCollection<ScanLogRowViewModel>();

        Loaded += async (_, _) => await LoadPageAsync();
    }

    private async Task LoadPageAsync()
    {
        ErrorText.Visibility = Visibility.Collapsed;
        LoadingText.Visibility = Visibility.Visible;
        ItemsGrid.Visibility = Visibility.Collapsed;
        EmptyText.Visibility = Visibility.Collapsed;
        PaginationPanel.Visibility = Visibility.Collapsed;

        try
        {
            var result = await _attendanceApi.GetScanLogsAsync(_staff.EmpCode, _date, _page, 20);
            _totalPages = Math.Max(1, result.TotalPages);

            var rows = (result.Items ?? [])
                .Select(item => new ScanLogRowViewModel
                {
                    TimeText = AttendanceFormatHelper.FormatClockDisplay(item.ScannedAt),
                    DirectionText = AttendanceActionHelper.FormatScanDirection(item.Direction),
                    ScoreText = item.Score?.ToString() ?? "—",
                    MachineText = AttendanceFormatHelper.FormatKioskMachineParts(
                        item.KioskLabel, item.ClientHostname, item.ClientIp),
                    MessageText = string.IsNullOrWhiteSpace(item.Message) ? "—" : item.Message
                })
                .ToList();

            ItemsGrid.ItemsSource = new ObservableCollection<ScanLogRowViewModel>(rows);
            PageSummaryText.Text = $"Trang {_page}/{_totalPages}";

            LoadingText.Visibility = Visibility.Collapsed;
            if (rows.Count == 0)
            {
                EmptyText.Visibility = Visibility.Visible;
                ItemsGrid.Visibility = Visibility.Collapsed;
                PaginationPanel.Visibility = Visibility.Collapsed;
            }
            else
            {
                ItemsGrid.Visibility = Visibility.Visible;
                PaginationPanel.Visibility = _totalPages > 1 ? Visibility.Visible : Visibility.Collapsed;
            }

            PreviousButton.IsEnabled = _page > 1;
            NextButton.IsEnabled = _page < _totalPages;
        }
        catch (ApiException ex)
        {
            LoadingText.Visibility = Visibility.Collapsed;
            ErrorText.Text = ex.Message;
            ErrorText.Visibility = Visibility.Visible;
        }
        catch (Exception)
        {
            LoadingText.Visibility = Visibility.Collapsed;
            ErrorText.Text = AdminUiStrings.ScanLogLoadError;
            ErrorText.Visibility = Visibility.Visible;
        }
    }

    private async void PreviousButton_Click(object sender, RoutedEventArgs e)
    {
        if (_page <= 1)
        {
            return;
        }

        _page--;
        await LoadPageAsync();
    }

    private async void NextButton_Click(object sender, RoutedEventArgs e)
    {
        if (_page >= _totalPages)
        {
            return;
        }

        _page++;
        await LoadPageAsync();
    }

    private void CloseButton_Click(object sender, RoutedEventArgs e) => Close();

    private sealed class ScanLogRowViewModel
    {
        public string TimeText { get; init; } = "—";
        public string DirectionText { get; init; } = "—";
        public string ScoreText { get; init; } = "—";
        public string MachineText { get; init; } = "—";
        public string MessageText { get; init; } = "—";
    }
}
