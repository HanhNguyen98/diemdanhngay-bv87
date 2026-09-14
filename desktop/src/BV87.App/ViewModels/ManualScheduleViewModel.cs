using System.Collections.ObjectModel;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Attendance;

namespace BV87.App.ViewModels;

/// <summary>Read-only merged manual-status periods for one employee (SPEC §2.18.6).</summary>
public sealed class ManualScheduleViewModel : ViewModelBase
{
    private const int MaxSpanDays = 400;
    private const int DefaultPastDays = 30;
    private const int DefaultFutureDays = 365;
    private const string StatusAll = "ALL";
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private readonly AttendanceApiClient _attendanceApi;
    private readonly StaffAttendanceRow _staff;

    private List<ManualSchedulePeriodDto> _allItems = [];
    private DateOnly _appliedFrom;
    private DateOnly _appliedTo;
    private string _appliedStatus = StatusAll;
    private string _statusFilterDraft = StatusAll;
    private DateTime? _dateFromDraft;
    private DateTime? _dateToDraft;
    private int _currentPage = 1;
    private int _pageSize = 20;
    private bool _isLoading;
    private bool _hasListLoaded;
    private bool _isRefreshing;
    private string? _errorMessage;
    private int _loadGeneration;

    public ManualScheduleViewModel(AttendanceApiClient attendanceApi, StaffAttendanceRow staff)
    {
        _attendanceApi = attendanceApi;
        _staff = staff;

        var today = AttendanceFormatHelper.TodayVietnam();
        _appliedFrom = today.AddDays(-DefaultPastDays);
        _appliedTo = today.AddDays(DefaultFutureDays);
        _dateFromDraft = _appliedFrom.ToDateTime(TimeOnly.MinValue);
        _dateToDraft = _appliedTo.ToDateTime(TimeOnly.MinValue);

        PagedItems = new ObservableCollection<ManualScheduleRowViewModel>();
        StatusFilterOptions =
        [
            new ManualScheduleStatusFilterOption(StatusAll, AttendanceUiStrings.ManualScheduleFilterStatusAll),
            new ManualScheduleStatusFilterOption(
                AttendanceStatusCodes.NghiPhep, AttendanceUiStrings.ManualScheduleStatusNghiPhep),
            new ManualScheduleStatusFilterOption(
                AttendanceStatusCodes.DiHoc, AttendanceUiStrings.ManualScheduleStatusDiHoc),
            new ManualScheduleStatusFilterOption(
                AttendanceStatusCodes.DiCongTac, AttendanceUiStrings.ManualScheduleStatusCongTac),
            new ManualScheduleStatusFilterOption(
                AttendanceStatusCodes.ThaiSan, AttendanceUiStrings.ManualScheduleStatusThaiSan)
        ];

        SearchCommand = new RelayCommand(async () => await ApplyFilterAsync(), () => !IsLoading && !IsRefreshing);
        CloseCommand = new RelayCommand(() => CloseRequested?.Invoke(this, EventArgs.Empty));
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);

        _ = LoadAsync(force: false);
    }

    public ObservableCollection<ManualScheduleRowViewModel> PagedItems { get; }
    public IReadOnlyList<ManualScheduleStatusFilterOption> StatusFilterOptions { get; }

    public ICommand SearchCommand { get; }
    public ICommand CloseCommand { get; }
    public ICommand GoToPageCommand { get; }

    public string StaffInfo => AttendanceUiStrings.FormatManualScheduleStaffInfo(
        _staff.EmpCodeFormatted ?? _staff.EmpCode.ToString(),
        _staff.Fullname);
    public string UnitLabel => AttendanceUiStrings.ManualScheduleUnitLabel;

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

    public string SelectedStatusFilter
    {
        get => _statusFilterDraft;
        set => SetProperty(ref _statusFilterDraft, string.IsNullOrEmpty(value) ? StatusAll : value);
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

    public event EventHandler? CloseRequested;

    private List<ManualSchedulePeriodDto> FilteredItems
    {
        get
        {
            IEnumerable<ManualSchedulePeriodDto> source = _allItems;
            if (!string.Equals(_appliedStatus, StatusAll, StringComparison.OrdinalIgnoreCase))
            {
                source = source.Where(r =>
                    string.Equals(r.Status, _appliedStatus, StringComparison.OrdinalIgnoreCase));
            }

            return source.ToList();
        }
    }

    /// <summary>Copies date/status drafts then reloads the schedule.</summary>
    private async Task ApplyFilterAsync()
    {
        var from = ToDateOnly(DateFromDraft);
        var to = ToDateOnly(DateToDraft);
        if (from == null || to == null)
        {
            ErrorMessage = AttendanceUiStrings.ManualScheduleNeedDates;
            return;
        }

        if (to < from)
        {
            ErrorMessage = AttendanceUiStrings.ManualScheduleInvalidOrder;
            return;
        }

        if (AttendanceActionHelper.DaysInclusive(from.Value, to.Value) > MaxSpanDays)
        {
            ErrorMessage = AttendanceUiStrings.ManualScheduleTooLong;
            return;
        }

        ErrorMessage = null;
        _appliedFrom = from.Value;
        _appliedTo = to.Value;
        _appliedStatus = _statusFilterDraft;
        _currentPage = 1;
        await LoadAsync(force: true);
    }

    private async Task LoadAsync(bool force)
    {
        if (IsLoading && !force)
        {
            return;
        }

        var generation = ++_loadGeneration;
        ListLoadBusy.Begin(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);

        try
        {
            var result = await _attendanceApi.GetManualScheduleAsync(_staff.EmpCode, _appliedFrom, _appliedTo);
            if (generation != _loadGeneration)
            {
                return;
            }

            _allItems = result.Items ?? [];
            _currentPage = 1;
            ApplyPaging();
        }
        catch (Exception ex)
        {
            if (generation != _loadGeneration)
            {
                return;
            }

            ErrorMessage = ExtractMessage(ex);
            _allItems = [];
            PagedItems.Clear();
            OnPropertyChanged(nameof(TotalItems));
            OnPropertyChanged(nameof(TotalPages));
            OnPropertyChanged(nameof(CurrentPage));
        }
        finally
        {
            if (generation == _loadGeneration)
            {
                ListLoadBusy.End(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);
            }
        }
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
        var filtered = FilteredItems
            .Select(item => new ManualScheduleRowViewModel(item))
            .ToList();
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

    private static DateOnly? ToDateOnly(DateTime? value) =>
        value == null ? null : DateOnly.FromDateTime(value.Value);

    private static string ExtractMessage(Exception ex) =>
        ex is ApiException apiEx && !string.IsNullOrWhiteSpace(apiEx.Message)
            ? apiEx.Message
            : AttendanceUiStrings.ManualScheduleLoadError;
}
