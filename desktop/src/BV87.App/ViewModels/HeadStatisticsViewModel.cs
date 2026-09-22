using System.Collections.ObjectModel;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Excel;
using BV87.Core.Helpers;
using BV87.Core.Models.Attendance;

namespace BV87.App.ViewModels;

public sealed class HeadStatisticsViewModel : ViewModelBase
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private readonly AttendanceApiClient _attendanceApi;
    private readonly ExcelFileService _excelFileService = new();
    private readonly int _deptCode;
    private readonly string _pageTitle;

    private DateOnly _appliedFrom;
    private DateOnly _appliedTo;
    private string _appliedSearch = string.Empty;
    private string _searchDraft = string.Empty;
    private string _selectedPreset = HeadUiStrings.Statistics.PresetThisMonth;
    private DateTime? _dateFromDraft;
    private DateTime? _dateToDraft;
    private int _currentPage = 1;
    private int _pageSize = 20;
    private long _totalItems;
    private int _totalPages = 1;
    private bool _isLoading;
    private bool _isRefreshing;
    private bool _isExporting;
    private bool _statsReady;
    private bool _hasListLoaded;
    private string? _errorMessage;
    private string? _deptName;
    private long _kpiTotal;

    public HeadStatisticsViewModel(AttendanceApiClient attendanceApi, int deptCode, string? deptName)
    {
        _attendanceApi = attendanceApi;
        _deptCode = deptCode;
        _pageTitle = HeadPageTitleFormatter.Format(HeadUiStrings.Statistics.PageTitle, deptName);

        var range = StatisticsDateRangeHelper.GetDefaultRange();
        _appliedFrom = range.From;
        _appliedTo = range.To;
        _dateFromDraft = AdminUtilitiesFormatHelper.ToDateTime(range.From);
        _dateToDraft = AdminUtilitiesFormatHelper.ToDateTime(range.To);

        HistoryItems = new ObservableCollection<AttendanceHistoryRowViewModel>();
        KpiItems = new ObservableCollection<StatusBreakdownItem>();
        TimePresetOptions = new ObservableCollection<TimeRangePresetOption>
        {
            new() { Value = HeadUiStrings.Statistics.PresetThisMonth, Label = HeadUiStrings.Statistics.PresetThisMonthLabel },
            new() { Value = HeadUiStrings.Statistics.PresetThisWeek, Label = HeadUiStrings.Statistics.PresetThisWeekLabel },
            new() { Value = HeadUiStrings.Statistics.PresetLastMonth, Label = HeadUiStrings.Statistics.PresetLastMonthLabel },
            new() { Value = HeadUiStrings.Statistics.PresetLast30Days, Label = HeadUiStrings.Statistics.PresetLast30DaysLabel }
        };

        RefreshCommand = new RelayCommand(async () => await LoadAllAsync(force: true));
        ApplyFilterCommand = new RelayCommand(ApplyFilter);
        ResetFiltersCommand = new RelayCommand(ResetFilters);
        ExportExcelCommand = new RelayCommand(ExportExcel, () => _statsReady && !IsExporting);
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);

        _ = LoadAllAsync(force: false);
    }

    public ObservableCollection<AttendanceHistoryRowViewModel> HistoryItems { get; }
    public ObservableCollection<StatusBreakdownItem> KpiItems { get; }
    public ObservableCollection<TimeRangePresetOption> TimePresetOptions { get; }

    public ICommand RefreshCommand { get; }
    public ICommand ApplyFilterCommand { get; }
    public ICommand ResetFiltersCommand { get; }
    public ICommand ExportExcelCommand { get; }
    public ICommand GoToPageCommand { get; }

    public string PageTitle => _pageTitle;

    public string PageSubtitle => string.IsNullOrWhiteSpace(_deptName)
        ? $"{FormatDate(_appliedFrom)} — {FormatDate(_appliedTo)}"
        : $"{_deptName} · {FormatDate(_appliedFrom)} — {FormatDate(_appliedTo)}";

    public string KpiTotalText => _kpiTotal.ToString("N0");

    public string KpiUnit => HeadUiStrings.Statistics.KpiUnit;

    public string HistoryTitle => HeadUiStrings.Statistics.HistoryTitle;

    public string ExportExcelLabel => HeadUiStrings.Statistics.ExportExcel;

    public string ExportFilename => HeadUiStrings.Statistics.ExportFilename;

    public string EmptyMessage => HeadUiStrings.Statistics.NoHistory;

    public bool IsLoading
    {
        get => _isLoading;
        private set => SetProperty(ref _isLoading, value);
    }

    public bool IsRefreshing
    {
        get => _isRefreshing;
        private set => SetProperty(ref _isRefreshing, value);
    }

    public bool IsExporting
    {
        get => _isExporting;
        private set => SetProperty(ref _isExporting, value);
    }

    public bool ShowKpi => _statsReady;

    public string? ErrorMessage
    {
        get => _errorMessage;
        private set => SetProperty(ref _errorMessage, value);
    }

    public string SearchDraft
    {
        get => _searchDraft;
        set => SetProperty(ref _searchDraft, value);
    }

    public string SelectedTimePreset
    {
        get => _selectedPreset;
        set
        {
            if (!SetProperty(ref _selectedPreset, value))
            {
                return;
            }

            var range = StatisticsDateRangeHelper.GetRange(value, AttendanceFormatHelper.TodayVietnam());
            DateFromDraft = AdminUtilitiesFormatHelper.ToDateTime(range.From);
            DateToDraft = AdminUtilitiesFormatHelper.ToDateTime(range.To);
        }
    }

    public DateTime? DateFromDraft
    {
        get => _dateFromDraft;
        set => SetProperty(ref _dateFromDraft, value);
    }

    public DateTime? DateToDraft
    {
        get => _dateToDraft;
        set => SetProperty(ref _dateToDraft, value);
    }

    public int CurrentPage => _currentPage;

    public int PageSize
    {
        get => _pageSize;
        set
        {
            if (value <= 0)
            {
                return;
            }

            if (SetProperty(ref _pageSize, value))
            {
                _currentPage = 1;
                _ = LoadHistoryPageAsync();
            }
        }
    }

    public IReadOnlyList<int> PageSizeOptions { get; } = DefaultPageSizeOptions;

    public long TotalItems => _totalItems;

    public int TotalPages => Math.Max(1, _totalPages);

    public bool ShowPagination => true;

    private async Task LoadAllAsync(bool force)
    {
        if (IsLoading && !force)
        {
            return;
        }

        ListLoadBusy.Begin(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);

        ErrorMessage = null;

        try
        {
            await LoadStatisticsAsync();
            await LoadHistoryAsync();
        }
        finally
        {
            ListLoadBusy.End(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);
            CommandManager.InvalidateRequerySuggested();
        }
    }

    private async Task LoadStatisticsAsync()
    {
        try
        {
            var result = await _attendanceApi.GetStatisticsAsync(
                _deptCode,
                _appliedFrom,
                _appliedTo,
                _appliedSearch);

            _deptName = result.DeptName;
            UpdateKpi(result.Summary?.StatusBreakdown ?? []);
            _statsReady = true;

            OnPropertyChanged(nameof(PageSubtitle));
            OnPropertyChanged(nameof(KpiTotalText));
            OnPropertyChanged(nameof(ShowKpi));
        }
        catch (ApiException ex)
        {
            ErrorMessage = ex.Message;
            _statsReady = false;
            KpiItems.Clear();
            _kpiTotal = 0;
            OnPropertyChanged(nameof(KpiTotalText));
            OnPropertyChanged(nameof(ShowKpi));
        }
        catch (Exception)
        {
            ErrorMessage = HeadUiStrings.Statistics.LoadError;
            _statsReady = false;
            KpiItems.Clear();
            _kpiTotal = 0;
            OnPropertyChanged(nameof(KpiTotalText));
            OnPropertyChanged(nameof(ShowKpi));
        }
    }

    private async Task LoadHistoryAsync()
    {
        try
        {
            var data = await _attendanceApi.GetStatisticsHistoryAsync(
                _deptCode,
                _appliedFrom,
                _appliedTo,
                _appliedSearch,
                _currentPage,
                _pageSize);

            HistoryItems.Clear();
            var rows = (data.Items ?? []).Select(item => new AttendanceHistoryRowViewModel(item)).ToList();
            PaginationRowNumberHelper.Apply(rows, _currentPage, _pageSize);
            foreach (var row in rows)
            {
                HistoryItems.Add(row);
            }

            _currentPage = data.Page > 0 ? data.Page : _currentPage;
            _totalItems = data.TotalItems;
            _totalPages = Math.Max(data.TotalPages, 1);

            OnPropertyChanged(nameof(CurrentPage));
            OnPropertyChanged(nameof(TotalItems));
            OnPropertyChanged(nameof(TotalPages));
            OnPropertyChanged(nameof(ShowPagination));
        }
        catch (ApiException ex)
        {
            ErrorMessage = ex.Message;
            HistoryItems.Clear();
            _totalItems = 0;
            _totalPages = 1;
            OnPropertyChanged(nameof(TotalItems));
            OnPropertyChanged(nameof(TotalPages));
            OnPropertyChanged(nameof(ShowPagination));
        }
        catch (Exception)
        {
            ErrorMessage = HeadUiStrings.Statistics.LoadError;
            HistoryItems.Clear();
            _totalItems = 0;
            _totalPages = 1;
            OnPropertyChanged(nameof(TotalItems));
            OnPropertyChanged(nameof(TotalPages));
            OnPropertyChanged(nameof(ShowPagination));
        }
    }

    private void UpdateKpi(IReadOnlyList<StatusBreakdownItem> breakdown)
    {
        KpiItems.Clear();
        _kpiTotal = 0;

        foreach (var item in breakdown)
        {
            if (IsUncheckedZero(item))
            {
                continue;
            }

            KpiItems.Add(item);
            _kpiTotal += item.Count;
        }

        OnPropertyChanged(nameof(ShowKpi));
    }

    private static bool IsUncheckedZero(StatusBreakdownItem item) =>
        string.Equals(item.Code, "UNCHECKED", StringComparison.OrdinalIgnoreCase)
        && item.Count <= 0;

    private void ApplyFilter()
    {
        var from = AdminUtilitiesFormatHelper.ToDateOnly(DateFromDraft);
        var to = AdminUtilitiesFormatHelper.ToDateOnly(DateToDraft);

        if (from == null || to == null)
        {
            return;
        }

        if (from > to)
        {
            ErrorMessage = HeadUiStrings.Statistics.InvalidRange;
            return;
        }

        if (StatisticsDateRangeHelper.DaysInclusive(from.Value, to.Value) > StatisticsDateRangeHelper.MaxRangeDays)
        {
            ErrorMessage = HeadUiStrings.Statistics.MaxRangeExceeded;
            return;
        }

        _appliedFrom = from.Value;
        _appliedTo = to.Value;
        _appliedSearch = SearchDraft.Trim();
        _currentPage = 1;
        ErrorMessage = null;

        _ = LoadAllAsync(force: true);
    }

    private void ResetFilters()
    {
        _selectedPreset = HeadUiStrings.Statistics.PresetThisMonth;
        OnPropertyChanged(nameof(SelectedTimePreset));

        var range = StatisticsDateRangeHelper.GetDefaultRange();
        DateFromDraft = AdminUtilitiesFormatHelper.ToDateTime(range.From);
        DateToDraft = AdminUtilitiesFormatHelper.ToDateTime(range.To);
        SearchDraft = string.Empty;
        ApplyFilter();
    }

    private void ChangePage(int page)
    {
        if (page < 1 || page > TotalPages)
        {
            return;
        }

        _currentPage = page;
        _ = LoadHistoryPageAsync();
    }

    private async Task LoadHistoryPageAsync()
    {
        IsRefreshing = true;
        try
        {
            await LoadHistoryAsync();
        }
        finally
        {
            IsRefreshing = false;
            CommandManager.InvalidateRequerySuggested();
        }
    }

    private async void ExportExcel()
    {
        if (!_statsReady || IsExporting)
        {
            return;
        }

        IsExporting = true;
        ErrorMessage = null;

        try
        {
            var rows = await _attendanceApi.ExportStatisticsHistoryAsync(
                _deptCode,
                _appliedFrom,
                _appliedTo,
                _appliedSearch);

            if (rows.Count == 0)
            {
                ErrorMessage = HeadUiStrings.Statistics.NoHistory;
                return;
            }

            _pendingExportRows = rows;
            ExportRequested?.Invoke(this, EventArgs.Empty);
        }
        catch (ApiException ex)
        {
            ErrorMessage = ex.Message;
        }
        catch (Exception)
        {
            ErrorMessage = HeadUiStrings.Statistics.LoadError;
        }
        finally
        {
            IsExporting = false;
            CommandManager.InvalidateRequerySuggested();
        }
    }

    private List<AttendanceHistoryItem>? _pendingExportRows;

    public void WriteExport(string filePath)
    {
        if (_pendingExportRows == null || _pendingExportRows.Count == 0)
        {
            return;
        }

        WriteExport(_pendingExportRows, filePath);
    }

    public void WriteExport(IReadOnlyList<AttendanceHistoryItem> rows, string filePath)
    {
        var config = new ExcelRegistryConfig
        {
            TemplateFilename = HeadUiStrings.Statistics.ExportFilename,
            ExportFilename = HeadUiStrings.Statistics.ExportFilename,
            SheetName = HeadUiStrings.Statistics.ExportSheet,
            TemplateHeaders = [],
            TemplateSampleRow = [],
            ExportHeaders =
            [
                "Ngày",
                "Họ và tên",
                "Mã số",
                "Trạng thái",
                "Ghi chú"
            ]
        };

        var exportRows = rows.Select(row =>
        {
            var vm = new AttendanceHistoryRowViewModel(row);
            return (IReadOnlyList<object>)[
                vm.DateText,
                vm.Fullname,
                vm.EmpCodeFormatted,
                vm.StatusLabel,
                vm.NoteText == "—" ? string.Empty : vm.NoteText
            ];
        }).ToList();

        _excelFileService.WriteExport(config, exportRows, filePath);
    }

    public event EventHandler? ExportRequested;

    private static string FormatDate(DateOnly date) => date.ToString("dd/MM/yyyy");
}
