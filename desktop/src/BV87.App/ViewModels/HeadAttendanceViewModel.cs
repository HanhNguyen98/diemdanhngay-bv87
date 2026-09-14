using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.App.Views.Attendance;
using BV87.App.Views.Head;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Attendance;

namespace BV87.App.ViewModels;

public sealed class HeadAttendanceViewModel : ViewModelBase
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private readonly AttendanceApiClient _attendanceApi;
    private readonly int _deptCode;

    private AttendanceSummary? _summary;
    private List<StaffAttendanceRow> _allStaff = [];
    private StaffAttendanceRow? _selectedStaff;
    private DateOnly _selectedDate;
    private string _searchText = string.Empty;
    private string _statusFilter = HeadUiStrings.Attendance.FilterAllStatus;
    private int _currentPage = 1;
    private int _pageSize = 20;
    private int _totalItems;
    private bool _isLoading;
    private bool _hasListLoaded;
    private bool _isRefreshing;
    private string? _statusMessage;
    private string? _errorMessage;
    private bool _showLockBanner;
    private string? _lockBannerText;
    private bool _tableDisabled;
    private bool _incompleteExplainAllowed;

    public HeadAttendanceViewModel(AttendanceApiClient attendanceApi, int deptCode)
    {
        _attendanceApi = attendanceApi;
        _deptCode = deptCode;
        _selectedDate = AttendanceFormatHelper.TodayVietnam();

        RecentDates = new ObservableCollection<DatePillItem>(BuildDatePills(_selectedDate));
        PagedStaff = new ObservableCollection<StaffAttendanceRow>();
        QuickActions = new ObservableCollection<QuickActionItem>();
        StatusFilterOptions = new ObservableCollection<string>
        {
            HeadUiStrings.Attendance.FilterAllStatus,
            HeadUiStrings.Attendance.FilterUnchecked
        };
        KpiItems = new ObservableCollection<StatusBreakdownItem>();

        RefreshCommand = new RelayCommand(async () => await LoadAsync(force: true));
        SelectDateCommand = new RelayCommand<DateOnly>(async date => await ChangeDateAsync(date));
        ApplyFiltersCommand = new RelayCommand(() => ListLoadBusy.RunRefreshing(v => IsRefreshing = v, ApplyFilters));
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);
        QuickActionCommand = new RelayCommand<QuickActionItem>(async action =>
        {
            if (action != null)
            {
                await HandleQuickActionAsync(action);
            }
        }, action => action != null && SelectedStaff != null && CanApply(action));

        _ = InitializeAsync();
    }

    public ObservableCollection<DatePillItem> RecentDates { get; }
    public ObservableCollection<StaffAttendanceRow> PagedStaff { get; }
    public ObservableCollection<QuickActionItem> QuickActions { get; }
    public ObservableCollection<string> StatusFilterOptions { get; }
    public ObservableCollection<StatusBreakdownItem> KpiItems { get; }

    public ICommand RefreshCommand { get; }
    public ICommand SelectDateCommand { get; }
    public ICommand ApplyFiltersCommand { get; }
    public ICommand GoToPageCommand { get; }
    public ICommand QuickActionCommand { get; }

    public DateOnly SelectedDate
    {
        get => _selectedDate;
        private set => SetProperty(ref _selectedDate, value);
    }

    public StaffAttendanceRow? SelectedStaff
    {
        get => _selectedStaff;
        set
        {
            if (SetProperty(ref _selectedStaff, value))
            {
                OnPropertyChanged(nameof(SelectedStaffName));
                OnPropertyChanged(nameof(ShowQuickPanel));
                CommandManager.InvalidateRequerySuggested();
            }
        }
    }

    public string SelectedStaffName => SelectedStaff?.Fullname ?? "—";

    public string SearchText
    {
        get => _searchText;
        set => SetProperty(ref _searchText, value);
    }

    public string StatusFilter
    {
        get => _statusFilter;
        set => SetProperty(ref _statusFilter, value);
    }

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

    public string DeptTitle => _summary?.DeptNameDisplay ?? _summary?.DeptName ?? $"Đơn vị {_deptCode:00}";

    public string ProgressText => _summary == null
        ? "—"
        : $"Đã chấm {_summary.MarkedCount}/{_summary.Total} ({_summary.ProgressPercent}%) · {HeadUiStrings.Attendance.ProgressScope}";

    public string AttendanceDateText => SelectedDate.ToString("dd/MM/yyyy");

    public string PageSubtitle => $"{ProgressText} · Ngày {AttendanceDateText}";

    public bool ShowLockBanner
    {
        get => _showLockBanner;
        private set => SetProperty(ref _showLockBanner, value);
    }

    public string? LockBannerText
    {
        get => _lockBannerText;
        private set => SetProperty(ref _lockBannerText, value);
    }

    public string? StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public string? ErrorMessage
    {
        get => _errorMessage;
        private set => SetProperty(ref _errorMessage, value);
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
                ApplyFilters();
            }
        }
    }

    public IReadOnlyList<int> PageSizeOptions { get; } = DefaultPageSizeOptions;

    public int TotalItems => _totalItems;

    public int TotalPages => TotalItems == 0
        ? 1
        : (int)Math.Ceiling(TotalItems / (double)_pageSize);

    public bool ShowPagination => true;

    public bool ShowQuickPanel => SelectedStaff != null;

    public bool IsToday => SelectedDate == AttendanceFormatHelper.TodayVietnam();

    public DateTime MaxSelectableDate =>
        AttendanceFormatHelper.TodayVietnam().ToDateTime(TimeOnly.MinValue);

    public DateTime? SelectedDatePicker
    {
        get => _selectedDate.ToDateTime(TimeOnly.MinValue);
        set
        {
            if (value == null)
            {
                return;
            }

            var picked = DateOnly.FromDateTime(value.Value);
            var today = AttendanceFormatHelper.TodayVietnam();
            if (picked > today)
            {
                picked = today;
            }

            if (picked == _selectedDate)
            {
                return;
            }

            _ = ChangeDateAsync(picked);
        }
    }

    public bool IsCustomDateSelected =>
        !AttendanceFormatHelper.RecentDates(4).Contains(SelectedDate);

    public bool ShowHistoryBanner => !IsToday;

    public string HistoryBannerText =>
        $"{HeadUiStrings.Attendance.ViewingHistoryPrefix} {AttendanceDateText} "
        + (_tableDisabled
            ? HeadUiStrings.Attendance.ViewingHistoryReadOnlySuffix
            : HeadUiStrings.Attendance.ViewingHistoryEditableSuffix);

    public bool ShowHistoryReadOnlyBadge => !IsToday && _tableDisabled && !_incompleteExplainAllowed;

    private async Task InitializeAsync()
    {
        try
        {
            var types = await _attendanceApi.GetStatusTypesAsync();
            foreach (var action in StatusCatalogHelper.BuildQuickActions(types))
            {
                QuickActions.Add(action);
            }

            foreach (var type in types.Where(t => t.Active && !t.GroupParent).OrderBy(t => t.SortOrder))
            {
                if (!StatusFilterOptions.Contains(type.Label))
                {
                    StatusFilterOptions.Add(type.Label);
                }
            }
        }
        catch (ApiException ex)
        {
            ErrorMessage = ex.Message;
        }

        await LoadAsync(force: false);
    }

    private async Task ChangeDateAsync(DateOnly date)
    {
        if (date == SelectedDate)
        {
            return;
        }

        SelectedDate = date;
        NotifyDateUiChanged();
        RefreshDatePills();
        await LoadAsync(force: false);
    }

    private void NotifyDateUiChanged()
    {
        OnPropertyChanged(nameof(IsToday));
        OnPropertyChanged(nameof(AttendanceDateText));
        OnPropertyChanged(nameof(PageSubtitle));
        OnPropertyChanged(nameof(SelectedDatePicker));
        OnPropertyChanged(nameof(IsCustomDateSelected));
        OnPropertyChanged(nameof(ShowHistoryBanner));
        OnPropertyChanged(nameof(HistoryBannerText));
        OnPropertyChanged(nameof(ShowHistoryReadOnlyBadge));
    }

    private async Task LoadAsync(bool force)
    {
        if (_isLoading && !force)
        {
            return;
        }

        ErrorMessage = null;
        ListLoadBusy.Begin(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);

        try
        {
            var page = await _attendanceApi.GetAttendancePageAsync(_deptCode, SelectedDate);
            _summary = page.Summary;
            _allStaff = page.Staff ?? [];

            UpdateLockState();
            UpdateKpi();
            _currentPage = 1;
            ApplyFilters();

            OnPropertyChanged(nameof(DeptTitle));
            OnPropertyChanged(nameof(ProgressText));
            OnPropertyChanged(nameof(PageSubtitle));
        }
        catch (ApiException ex)
        {
            ErrorMessage = ex.Message;
        }
        catch (Exception)
        {
            ErrorMessage = HeadUiStrings.Attendance.LoadError;
        }
        finally
        {
            ListLoadBusy.End(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);
            CommandManager.InvalidateRequerySuggested();
        }
    }

    private void UpdateLockState()
    {
        var editable = _summary?.Editable ?? false;
        var reportBlocked = _summary?.ReportBlocked ?? false;
        _incompleteExplainAllowed = _summary?.IncompleteExplainAllowed ?? false;
        var isToday = IsToday;

        var todayWriteDisabled = isToday && !editable && !_incompleteExplainAllowed;
        _tableDisabled = reportBlocked;
        ShowLockBanner = _tableDisabled || todayWriteDisabled || _incompleteExplainAllowed;
        LockBannerText = _summary?.LockMessage
            ?? (_incompleteExplainAllowed
                ? HeadUiStrings.Attendance.IncompleteExplainBanner
                : ShowLockBanner ? "Không thể chỉnh sửa dữ liệu trong khung thời gian này." : null);

        OnPropertyChanged(nameof(HistoryBannerText));
        OnPropertyChanged(nameof(ShowHistoryReadOnlyBadge));
        CommandManager.InvalidateRequerySuggested();
    }

    private void UpdateKpi()
    {
        KpiItems.Clear();
        if (_summary?.StatusBreakdown == null)
        {
            return;
        }

        foreach (var item in _summary.StatusBreakdown.Where(i => i.Count > 0))
        {
            KpiItems.Add(item);
        }
    }

    private void ApplyFilters()
    {
        IEnumerable<StaffAttendanceRow> filtered = _allStaff;

        if (!string.IsNullOrWhiteSpace(SearchText))
        {
            var q = SearchText.Trim().ToLowerInvariant();
            filtered = filtered.Where(s =>
                s.Fullname.ToLowerInvariant().Contains(q)
                || s.EmpCode.ToString().Contains(q)
                || (s.EmpCodeFormatted ?? "").Contains(q, StringComparison.OrdinalIgnoreCase)
                || (s.PositionName ?? "").ToLowerInvariant().Contains(q)
                || (s.RankName ?? "").ToLowerInvariant().Contains(q));
        }

        filtered = StatusFilter switch
        {
            var f when f == HeadUiStrings.Attendance.FilterUnchecked => filtered.Where(s => s.IsUnchecked),
            var f when f == HeadUiStrings.Attendance.FilterAllStatus => filtered,
            _ => filtered.Where(s => string.Equals(s.StatusLabel, StatusFilter, StringComparison.OrdinalIgnoreCase)
                || string.Equals(s.DisplayStatus, StatusFilter, StringComparison.OrdinalIgnoreCase))
        };

        var list = filtered.ToList();
        _totalItems = list.Count;

        if (_currentPage > TotalPages)
        {
            _currentPage = TotalPages;
        }

        PagedStaff.Clear();
        var startIndex = (_currentPage - 1) * _pageSize;
        var pageRows = list.Skip(startIndex).Take(_pageSize).ToList();
        PaginationRowNumberHelper.Apply(pageRows, _currentPage, _pageSize);
        foreach (var row in pageRows)
        {
            PagedStaff.Add(row);
        }

        OnPropertyChanged(nameof(CurrentPage));
        OnPropertyChanged(nameof(TotalPages));
        OnPropertyChanged(nameof(TotalItems));
        OnPropertyChanged(nameof(ShowPagination));
        CommandManager.InvalidateRequerySuggested();
    }

    private void ChangePage(int page)
    {
        if (page < 1 || page > TotalPages)
        {
            return;
        }

        _currentPage = page;
        ApplyFilters();
    }

    private bool CanApply(QuickActionItem action) =>
        SelectedStaff != null
        && StatusCatalogHelper.CanApplyQuickAction(
            SelectedStaff, action, _tableDisabled, _incompleteExplainAllowed);

    private async Task HandleQuickActionAsync(QuickActionItem action)
    {
        if (SelectedStaff == null)
        {
            return;
        }

        if (AttendanceActionHelper.IsPostScanOverrideAction(action)
            && AttendanceActionHelper.NeedsNghiTrucWizard(SelectedStaff))
        {
            var staff = SelectedStaff;
            if (staff == null)
            {
                return;
            }

            var wizard = new NghiTrucAssignDialog(staff, SelectedDate)
            {
                Owner = Application.Current.MainWindow
            };

            if (wizard.ShowDialog() != true || wizard.Result == null)
            {
                return;
            }

            try
            {
                var result = await _attendanceApi.AssignNghiTrucWizardAsync(wizard.Result);
                ErrorMessage = null;
                StatusMessage = null;
                NghiTrucWizardFeedback.ShowResult(result, staff, wizard.Result.PayrollIntent);
                await LoadAsync(force: true);
            }
            catch (ApiException)
            {
                ErrorMessage = null;
                StatusMessage = null;
                NghiTrucWizardFeedback.ShowFailure(staff.Fullname);
            }

            return;
        }

        if (string.Equals(action.Code, AttendanceStatusCodes.VeSom, StringComparison.OrdinalIgnoreCase))
        {
            var note = PromptNote("Lý do về sớm");
            if (note == null)
            {
                return;
            }

            try
            {
                await _attendanceApi.UpdateAttendanceAsync(new UpdateAttendanceRequest
                {
                    EmpCode = SelectedStaff.EmpCode,
                    Status = AttendanceStatusCodes.VeSom,
                    Note = note
                }, SelectedDate);
                ErrorMessage = null;
                ShellToast.Success(ToastCopy.Ok("lưu", "lý do về sớm", ToastCopy.Staff(SelectedStaff.Fullname)));
                await LoadAsync(force: true);
            }
            catch (ApiException)
            {
                ShellToast.Danger(ToastCopy.Fail("lưu", "lý do về sớm", ToastCopy.Staff(SelectedStaff.Fullname)));
            }

            return;
        }

        var dialog = new ManualRangeDialog(SelectedStaff, action, SelectedDate, _incompleteExplainAllowed)
        {
            Owner = Application.Current.MainWindow
        };

        if (dialog.ShowDialog() != true || dialog.Result == null)
        {
            return;
        }

        try
        {
            var result = await _attendanceApi.UpdateManualRangeAsync(dialog.Result);
            ErrorMessage = null;
            ShellToast.FromRangeResult(result, SelectedStaff.Fullname, dialog.ActionLabel);
            await LoadAsync(force: true);
        }
        catch (ApiException)
        {
            ShellToast.Danger(AttendanceUiStrings.FormatManualRangeFail(SelectedStaff.Fullname, dialog.ActionLabel));
        }
    }

    private static string? PromptNote(string title)
    {
        var dialog = new SimpleInputDialog(title, "Nhập ghi chú (bắt buộc):")
        {
            Owner = Application.Current.MainWindow
        };
        return dialog.ShowDialog() == true ? dialog.InputText : null;
    }

    private void RefreshDatePills()
    {
        RecentDates.Clear();
        foreach (var pill in BuildDatePills(SelectedDate))
        {
            RecentDates.Add(pill);
        }
    }

    private static IReadOnlyList<DatePillItem> BuildDatePills(DateOnly selected)
    {
        var today = AttendanceFormatHelper.TodayVietnam();
        return AttendanceFormatHelper.RecentDates(4)
            .Select(d => new DatePillItem
            {
                Date = d,
                Label = d == today ? HeadUiStrings.Attendance.TodayPill : d.ToString("dd/MM"),
                IsSelected = d == selected
            })
            .ToList();
    }
}
