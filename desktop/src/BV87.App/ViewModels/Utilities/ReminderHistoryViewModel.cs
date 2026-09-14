using System.Collections.ObjectModel;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.App.ViewModels;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Excel;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels.Utilities;

public sealed class ReminderHistoryViewModel : ViewModelBase
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private readonly AdminApiClient _adminApi;
    private readonly ExcelFileService _excelFileService = new();

    private const string TriggerAll = "ALL";
    private const string TriggerAuto = "AUTO";
    private const string TriggerManual = "MANUAL";

    private List<ReminderHistoryItemDto> _allHistory = [];
    private DateOnly _appliedFrom;
    private DateOnly _appliedTo;
    private int? _appliedDeptFilter;
    private string? _appliedTypeFilter;
    private int? _deptFilterDraft;
    private string? _typeFilterDraft = TriggerAll;
    private DateTime? _dateFromDraft;
    private DateTime? _dateToDraft;
    private int _currentPage = 1;
    private int _pageSize = 20;
    private bool _isLoading;
    private bool _hasListLoaded;
    private bool _isRefreshing;
    private bool _isExporting;
    private string? _errorMessage;

    public ReminderHistoryViewModel(AdminApiClient adminApi)
    {
        _adminApi = adminApi;
        var range = AdminUtilitiesFormatHelper.DefaultHistoryRange();
        _appliedFrom = range.From;
        _appliedTo = range.To;
        _dateFromDraft = AdminUtilitiesFormatHelper.ToDateTime(range.From);
        _dateToDraft = AdminUtilitiesFormatHelper.ToDateTime(range.To);

        PagedItems = new ObservableCollection<ReminderHistoryRowViewModel>();
        DeptFilterOptions = new ObservableCollection<DeptFilterOption>();
        TypeFilterOptions =
        [
            new ReminderTriggerFilterOption(TriggerAll, UtilitiesUiStrings.ReminderHistory.FilterTypeAll),
            new ReminderTriggerFilterOption(TriggerAuto, UtilitiesUiStrings.ReminderHistory.TriggerAuto),
            new ReminderTriggerFilterOption(TriggerManual, UtilitiesUiStrings.ReminderHistory.TriggerManual)
        ];

        RefreshCommand = new RelayCommand(async () => await LoadAsync(force: true));
        ApplyFilterCommand = new RelayCommand(ApplyFilter);
        ResetFiltersCommand = new RelayCommand(ResetFilters);
        ExportExcelCommand = new RelayCommand(ExportExcel, () => FilteredItems.Count > 0 && !IsExporting);
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);

        _ = InitializeAsync();
    }

    public ObservableCollection<ReminderHistoryRowViewModel> PagedItems { get; }
    public ObservableCollection<DeptFilterOption> DeptFilterOptions { get; }
    public IReadOnlyList<ReminderTriggerFilterOption> TypeFilterOptions { get; }

    public ICommand RefreshCommand { get; }
    public ICommand ApplyFilterCommand { get; }
    public ICommand ResetFiltersCommand { get; }
    public ICommand ExportExcelCommand { get; }
    public ICommand GoToPageCommand { get; }

    public string PageTitle => UtilitiesUiStrings.ReminderHistory.PageTitle;
    public string PageSubtitle => UtilitiesUiStrings.ReminderHistory.PageSubtitle;
    public string ListTitle => UtilitiesUiStrings.ReminderHistory.ListTitle;
    public string FilterRangeLabel => UtilitiesUiStrings.ReminderHistory.FilterRange;
    public string EmptyMessage => UtilitiesUiStrings.ReminderHistory.Empty;
    public string LoadingMessage => UtilitiesUiStrings.Loading;
    public string ExportExcelLabel => UtilitiesUiStrings.ReminderHistory.ExportExcel;
    public string UnitLabel => UtilitiesUiStrings.ReminderHistory.UnitLabel;

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

    public string? ErrorMessage
    {
        get => _errorMessage;
        private set => SetProperty(ref _errorMessage, value);
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

    public int? SelectedDeptFilter
    {
        get => _deptFilterDraft;
        set => SetProperty(ref _deptFilterDraft, value);
    }

    public string? SelectedTypeFilter
    {
        get => _typeFilterDraft;
        set => SetProperty(ref _typeFilterDraft, string.IsNullOrEmpty(value) ? TriggerAll : value);
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
                ApplyPaging();
            }
        }
    }

    public IReadOnlyList<int> PageSizeOptions { get; } = DefaultPageSizeOptions;

    public int TotalItems => FilteredItems.Count;

    public int TotalPages => TotalItems == 0
        ? 1
        : (int)Math.Ceiling(TotalItems / (double)_pageSize);

    public bool ShowPagination => true;

    public string ExportFilename =>
        $"lich-su-nhac-nho_{_appliedFrom:yyyy-MM-dd}_{_appliedTo:yyyy-MM-dd}.xlsx";

    private List<ReminderHistoryRowViewModel> FilteredItems
    {
        get
        {
            IEnumerable<ReminderHistoryItemDto> source = _allHistory;
            if (_appliedDeptFilter != null)
            {
                source = source.Where(r => r.DeptCode == _appliedDeptFilter);
            }

            if (!string.IsNullOrEmpty(_appliedTypeFilter))
            {
                source = source.Where(r => MatchesTriggerType(r, _appliedTypeFilter));
            }

            return source.Select(r => new ReminderHistoryRowViewModel(r)).ToList();
        }
    }

    private async Task InitializeAsync()
    {
        await LoadDepartmentsAsync();
        await LoadAsync(force: false);
    }

    private async Task LoadDepartmentsAsync()
    {
        try
        {
            var departments = await _adminApi.ListDepartmentsAsync();
            DeptFilterOptions.Clear();
            DeptFilterOptions.Add(new DeptFilterOption(null, AdminUiStrings.DeptFilterAll));
            foreach (var dept in departments.OrderBy(d => d.DeptCode))
            {
                DeptFilterOptions.Add(new DeptFilterOption(dept.DeptCode, dept.DisplayLabel));
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
        }
    }

    private async Task LoadAsync(bool force)
    {
        if (IsLoading && !force)
        {
            return;
        }

        ListLoadBusy.Begin(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);

        ErrorMessage = null;

        try
        {
            var data = await _adminApi.GetReminderHistoryAsync(_appliedFrom, _appliedTo);
            _allHistory = data.History ?? [];
            _currentPage = 1;
            ApplyPaging();
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
            _allHistory = [];
            PagedItems.Clear();
        }
        finally
        {
            ListLoadBusy.End(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);
        }
    }

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
            ErrorMessage = UtilitiesUiStrings.DateRangeInvalid;
            return;
        }

        ErrorMessage = null;
        _appliedFrom = from.Value;
        _appliedTo = to.Value;
        _appliedDeptFilter = _deptFilterDraft;
        _appliedTypeFilter = _typeFilterDraft;
        _currentPage = 1;
        _ = LoadAsync(force: true);
    }

    private void ResetFilters()
    {
        var range = AdminUtilitiesFormatHelper.DefaultHistoryRange();
        ErrorMessage = null;
        _appliedFrom = range.From;
        _appliedTo = range.To;
        _appliedDeptFilter = null;
        _deptFilterDraft = null;
        _appliedTypeFilter = null;
        _typeFilterDraft = TriggerAll;
        _dateFromDraft = AdminUtilitiesFormatHelper.ToDateTime(range.From);
        _dateToDraft = AdminUtilitiesFormatHelper.ToDateTime(range.To);
        OnPropertyChanged(nameof(DateFromDraft));
        OnPropertyChanged(nameof(DateToDraft));
        OnPropertyChanged(nameof(SelectedDeptFilter));
        OnPropertyChanged(nameof(SelectedTypeFilter));
        _currentPage = 1;
        _ = LoadAsync(force: true);
    }

    private void ChangePage(int page)
    {
        if (page < 1 || page > TotalPages)
        {
            return;
        }

        _currentPage = page;
        ApplyPaging();
    }

    private void ApplyPaging()
    {
        var filtered = FilteredItems;
        var skip = (_currentPage - 1) * _pageSize;
        var pageItems = filtered.Skip(skip).Take(_pageSize).ToList();
        PaginationRowNumberHelper.Apply(pageItems, _currentPage, _pageSize);

        PagedItems.Clear();
        foreach (var item in pageItems)
        {
            PagedItems.Add(item);
        }

        OnPropertyChanged(nameof(CurrentPage));
        OnPropertyChanged(nameof(TotalItems));
        OnPropertyChanged(nameof(TotalPages));
        OnPropertyChanged(nameof(ShowPagination));
    }

    public void ExportExcel(string filePath)
    {
        var config = new ExcelRegistryConfig
        {
            TemplateFilename = ExportFilename,
            ExportFilename = ExportFilename,
            SheetName = UtilitiesUiStrings.ReminderHistory.ExportSheet,
            TemplateHeaders = [],
            TemplateSampleRow = [],
            ExportHeaders =
            [
                UtilitiesUiStrings.ReminderHistory.ColDate,
                UtilitiesUiStrings.ReminderHistory.ColDept,
                UtilitiesUiStrings.ReminderHistory.ColType,
                UtilitiesUiStrings.ReminderHistory.ColTime
            ]
        };

        var rows = FilteredItems.Select(vm => (IReadOnlyList<object>)[
            vm.AttendanceDateText,
            vm.DeptName,
            vm.TriggerLabel,
            vm.SentAtText
        ]).ToList();

        _excelFileService.WriteExport(config, rows, filePath);
    }

    private void ExportExcel()
    {
        if (FilteredItems.Count == 0)
        {
            ErrorMessage = UtilitiesUiStrings.ReminderHistory.Empty;
            return;
        }

        IsExporting = true;
        try
        {
            ExportRequested?.Invoke(this, EventArgs.Empty);
        }
        finally
        {
            IsExporting = false;
        }
    }

    public event EventHandler? ExportRequested;

    private static bool MatchesTriggerType(ReminderHistoryItemDto row, string appliedType)
    {
        var isAuto = string.Equals(row.TriggerType, TriggerAuto, StringComparison.OrdinalIgnoreCase);
        if (string.Equals(appliedType, TriggerAuto, StringComparison.OrdinalIgnoreCase))
        {
            return isAuto;
        }

        if (string.Equals(appliedType, TriggerManual, StringComparison.OrdinalIgnoreCase))
        {
            return !isAuto;
        }

        return true;
    }

    private static string ExtractMessage(Exception ex) =>
        ex is ApiException apiEx && !string.IsNullOrWhiteSpace(apiEx.Message)
            ? apiEx.Message
            : ex.Message;
}
