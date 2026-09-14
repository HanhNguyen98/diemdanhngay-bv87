using System.Collections.ObjectModel;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.App.ViewModels.Utilities;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin;
using BV87.Core.Models.Attendance;

namespace BV87.App.ViewModels;

public sealed class AdminDashboardViewModel : ViewModelBase
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private readonly AdminApiClient _adminApi;

    private AdminDashboardResponse? _dashboard;
    private List<DeptProgressSummary> _allDepartments = [];
    private List<DepartmentListItem> _catalogDepartments = [];
    private int? _deptFilter;
    private int? _deptFilterDraft;
    private int _currentPage = 1;
    private int _pageSize = 20;
    private bool _isLoading;
    private bool _isRefreshing;
    private string? _statusMessage;
    private string? _errorMessage;
    private bool _showDiskBanner;
    private string? _diskBannerMessage;
    private FingerprintBannerTone _diskBannerTone = FingerprintBannerTone.None;
    private (int DeptCode, string Type)? _pendingAction;

    public AdminDashboardViewModel(AdminApiClient adminApi)
    {
        _adminApi = adminApi;

        PagedDepartments = new ObservableCollection<DeptProgressRowViewModel>();
        KpiItems = new ObservableCollection<StatusBreakdownItem>();
        DeptFilterOptions = new ObservableCollection<DeptFilterOption>();

        RefreshCommand = new RelayCommand(async () => await LoadAsync(force: true));
        ApplyDeptFilterCommand = new RelayCommand(() => ListLoadBusy.RunRefreshing(v => IsRefreshing = v, ApplyDeptFilter));
        ResetDeptFilterCommand = new RelayCommand(() => ListLoadBusy.RunRefreshing(v => IsRefreshing = v, ResetDeptFilter));
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);
        OpenReminderCommand = new RelayCommand(OpenReminder, () => RemindableDepts.Count > 0);
        OpenDeptDetailCommand = new RelayCommand<DeptProgressSummary>(
            OpenDeptDetail,
            dept => dept?.DeptCode != null);
        ToggleDeptLockCommand = new RelayCommand<DeptProgressSummary>(async dept =>
        {
            if (dept?.DeptCode != null)
            {
                await ToggleDeptLockAsync(dept);
            }
        });
        ToggleReportBlockCommand = new RelayCommand<DeptProgressSummary>(async dept =>
        {
            if (dept?.DeptCode != null)
            {
                await ToggleReportBlockAsync(dept);
            }
        });

        _ = InitializeAsync();
    }

    public ObservableCollection<DeptProgressRowViewModel> PagedDepartments { get; }
    public ObservableCollection<StatusBreakdownItem> KpiItems { get; }
    public ObservableCollection<DeptFilterOption> DeptFilterOptions { get; }

    public ICommand RefreshCommand { get; }
    public ICommand ApplyDeptFilterCommand { get; }
    public ICommand ResetDeptFilterCommand { get; }
    public ICommand GoToPageCommand { get; }
    public ICommand OpenReminderCommand { get; }
    public ICommand OpenDeptDetailCommand { get; }
    public ICommand ToggleDeptLockCommand { get; }
    public ICommand ToggleReportBlockCommand { get; }

    public event EventHandler<DeptDetailNavigationRequest>? DeptDetailRequested;

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

    public bool ShowDiskBanner
    {
        get => _showDiskBanner;
        private set => SetProperty(ref _showDiskBanner, value);
    }

    public string? DiskBannerMessage
    {
        get => _diskBannerMessage;
        private set => SetProperty(ref _diskBannerMessage, value);
    }

    public FingerprintBannerTone DiskBannerTone
    {
        get => _diskBannerTone;
        private set => SetProperty(ref _diskBannerTone, value);
    }

    public string ProgressTitle => AdminUiStrings.ProgressTitle;

    public string KpiTotalText => DisplayKpiTotal.ToString();

    public string KpiScopeLabel
    {
        get
        {
            if (_deptFilter == null)
            {
                return AdminUiStrings.KpiScopeHospital;
            }

            var catalog = _catalogDepartments.FirstOrDefault(d => d.DeptCode == _deptFilter);
            var label = catalog?.DisplayLabel
                ?? _allDepartments.FirstOrDefault(d => d.DeptCode == _deptFilter)?.DisplayName
                ?? _deptFilter.ToString();
            return $"Phạm vi: {label}";
        }
    }

    public string AttendanceDateText =>
        _dashboard?.AttendanceDate?.ToString("dd/MM/yyyy") ?? "—";

    public string PageSubtitle =>
        _deptFilter == null
            ? $"Theo dõi tiến độ chấm công toàn viện · Ngày {AttendanceDateText}"
            : $"{KpiScopeLabel} · Ngày {AttendanceDateText}";

    public int? SelectedDeptFilterDraft
    {
        get => _deptFilterDraft;
        set => SetProperty(ref _deptFilterDraft, value);
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
                ApplyPaging(resetPage: false);
            }
        }
    }

    public IReadOnlyList<int> PageSizeOptions { get; } = DefaultPageSizeOptions;

    public int TotalItems => FilteredDepartments.Count;

    public int TotalPages => TotalItems == 0
        ? 1
        : (int)Math.Ceiling(TotalItems / (double)_pageSize);

    public bool ShowPagination => true;

    public long DisplayKpiTotal => DisplayKpi?.Total ?? 0;

    public long DisplayKpiUnchecked => DisplayKpi?.Unchecked ?? 0;

    private AdminDashboardKpi? DisplayKpi
    {
        get
        {
            if (_deptFilter != null)
            {
                var dept = _allDepartments.FirstOrDefault(d => d.DeptCode == _deptFilter);
                if (dept == null)
                {
                    return null;
                }

                return new AdminDashboardKpi
                {
                    Total = dept.Total,
                    Unchecked = dept.UncheckedCount,
                    StatusBreakdown = dept.StatusBreakdown
                };
            }

            return _dashboard?.Kpi;
        }
    }

    private List<DeptProgressSummary> FilteredDepartments =>
        _deptFilter == null
            ? _allDepartments
            : _allDepartments.Where(d => d.DeptCode == _deptFilter).ToList();

    public List<DeptProgressSummary> RemindableDepts =>
        _allDepartments
            .Where(d => !d.IsCompleted && d.HasActiveHeadAccount && d.DeptCode != null)
            .ToList();

    public event EventHandler? ReminderRequested;

    public bool IsActionPending(int deptCode, string type) =>
        _pendingAction is { DeptCode: var code, Type: var actionType }
        && code == deptCode
        && actionType == type;

    public string GetLockActionLabel(DeptProgressSummary dept) =>
        dept.ManualLocked || dept.Locked ? AdminUiStrings.UnlockDept : AdminUiStrings.LockDept;

    public string GetReportBlockActionLabel(DeptProgressSummary dept) =>
        dept.ReportBlocked ? AdminUiStrings.UnblockHeadEdit : AdminUiStrings.BlockHeadEdit;

    public bool CanToggleReportBlock(DeptProgressSummary dept) => !dept.ReportSubmitted;

    private async Task InitializeAsync()
    {
        await LoadCatalogAsync();
        await LoadAsync(force: false);
    }

    private async Task LoadCatalogAsync()
    {
        try
        {
            _catalogDepartments = await _adminApi.ListDepartmentsAsync();
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

        if (_dashboard == null)
        {
            IsLoading = true;
        }
        else
        {
            IsRefreshing = true;
        }

        ErrorMessage = null;

        try
        {
            _dashboard = await _adminApi.GetDashboardAsync();
            _allDepartments = _dashboard.Departments ?? [];
            RefreshDeptFilterOptions();
            RefreshKpi();
            ApplyPaging(resetPage: force);
            OnPropertyChanged(nameof(KpiScopeLabel));
            OnPropertyChanged(nameof(AttendanceDateText));
            OnPropertyChanged(nameof(PageSubtitle));
            OnPropertyChanged(nameof(KpiTotalText));
            OnPropertyChanged(nameof(DisplayKpiUnchecked));
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
        }

        try
        {
            ApplyDiskBanner(await _adminApi.GetServerStorageAsync());
        }
        catch (Exception)
        {
            HideDiskBanner();
        }
        finally
        {
            IsLoading = false;
            IsRefreshing = false;
        }
    }

    private void ApplyDiskBanner(ServerStorageResponse? storage)
    {
        var level = storage?.Level?.Trim();
        var message = storage?.Message;
        if (string.IsNullOrWhiteSpace(message)
            || string.Equals(level, "ok", StringComparison.OrdinalIgnoreCase))
        {
            HideDiskBanner();
            return;
        }

        if (string.Equals(level, "danger", StringComparison.OrdinalIgnoreCase))
        {
            DiskBannerTone = FingerprintBannerTone.Danger;
        }
        else if (string.Equals(level, "warning", StringComparison.OrdinalIgnoreCase))
        {
            DiskBannerTone = FingerprintBannerTone.Warning;
        }
        else
        {
            HideDiskBanner();
            return;
        }

        DiskBannerMessage = message;
        ShowDiskBanner = true;
    }

    private void HideDiskBanner()
    {
        ShowDiskBanner = false;
        DiskBannerMessage = null;
        DiskBannerTone = FingerprintBannerTone.None;
    }

    private void RefreshKpi()
    {
        KpiItems.Clear();
        var kpi = DisplayKpi;
        if (kpi?.StatusBreakdown == null)
        {
            return;
        }

        foreach (var item in kpi.StatusBreakdown)
        {
            KpiItems.Add(item);
        }

        OnPropertyChanged(nameof(KpiTotalText));
        OnPropertyChanged(nameof(DisplayKpiUnchecked));
    }

    private void ApplyDeptFilter()
    {
        _deptFilter = _deptFilterDraft;
        _currentPage = 1;
        RefreshKpi();
        ApplyPaging(resetPage: true);
        OnPropertyChanged(nameof(KpiScopeLabel));
        OnPropertyChanged(nameof(PageSubtitle));
    }

    private void ResetDeptFilter()
    {
        _deptFilter = null;
        _deptFilterDraft = null;
        OnPropertyChanged(nameof(SelectedDeptFilterDraft));
        _currentPage = 1;
        RefreshKpi();
        ApplyPaging(resetPage: true);
        OnPropertyChanged(nameof(KpiScopeLabel));
        OnPropertyChanged(nameof(PageSubtitle));
    }

    private void ChangePage(int page)
    {
        if (page < 1 || page > TotalPages)
        {
            return;
        }

        _currentPage = page;
        ApplyPaging(resetPage: false);
    }

    private void ApplyPaging(bool resetPage)
    {
        if (resetPage)
        {
            _currentPage = 1;
        }

        if (_currentPage > TotalPages)
        {
            _currentPage = TotalPages;
        }

        PagedDepartments.Clear();
        var startIndex = (_currentPage - 1) * _pageSize;
        var pageSlice = FilteredDepartments.Skip(startIndex).Take(_pageSize).ToList();
        for (var i = 0; i < pageSlice.Count; i++)
        {
            PagedDepartments.Add(new DeptProgressRowViewModel
            {
                RowNumber = startIndex + i + 1,
                Dept = pageSlice[i]
            });
        }

        OnPropertyChanged(nameof(CurrentPage));
        OnPropertyChanged(nameof(TotalPages));
        OnPropertyChanged(nameof(TotalItems));
        OnPropertyChanged(nameof(ShowPagination));
        OnPropertyChanged(nameof(PagedDepartments));
        CommandManager.InvalidateRequerySuggested();
    }

    private void RefreshDeptFilterOptions()
    {
        var previous = _deptFilterDraft;
        DeptFilterOptions.Clear();
        DeptFilterOptions.Add(new DeptFilterOption(null, AdminUiStrings.DeptFilterAll));
        foreach (var dept in _allDepartments.OrderBy(d => d.DeptCode))
        {
            var catalog = _catalogDepartments.FirstOrDefault(d => d.DeptCode == dept.DeptCode);
            var label = catalog?.DisplayLabel ?? dept.DisplayName;
            DeptFilterOptions.Add(new DeptFilterOption(dept.DeptCode, label));
        }

        if (previous != null && _allDepartments.All(d => d.DeptCode != previous))
        {
            _deptFilter = null;
            _deptFilterDraft = null;
            OnPropertyChanged(nameof(SelectedDeptFilterDraft));
        }
    }

    private void OpenDeptDetail(DeptProgressSummary? dept)
    {
        if (dept?.DeptCode == null)
        {
            return;
        }

        var date = _dashboard?.AttendanceDate ?? AttendanceFormatHelper.TodayVietnam();
        DeptDetailRequested?.Invoke(this, new DeptDetailNavigationRequest
        {
            DeptCode = dept.DeptCode.Value,
            Date = date
        });
    }

    private void OpenReminder()
    {
        ReminderRequested?.Invoke(this, EventArgs.Empty);
    }

    public async Task<bool> SendRemindersAsync(IReadOnlyList<int> deptCodes)
    {
        if (deptCodes.Count == 0)
        {
            ShellToast.Warning("Chọn ít nhất một đơn vị.");
            return false;
        }

        try
        {
            var result = await _adminApi.SendRemindersAsync(deptCodes);
            if (result.Sent == 0)
            {
                ShellToast.Warning("Cảnh báo: không gửi được nhắc nhở; các đơn vị chưa có HEAD.");
            }
            else if (result.SkippedNoHead > 0)
            {
                ShellToast.Warning(ToastCopy.Warn(
                    "gửi",
                    "nhắc nhở",
                    $"{result.Sent} đơn vị",
                    $"bỏ qua {result.SkippedNoHead} đơn vị chưa có HEAD"));
            }
            else
            {
                ShellToast.Success(ToastCopy.OkItem("gửi", $"nhắc nhở cho {result.Sent} đơn vị"));
            }

            await LoadAsync(force: true);
            return result.Sent > 0;
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.FailItem("gửi", "nhắc nhở"));
            return false;
        }
    }

    private async Task ToggleDeptLockAsync(DeptProgressSummary dept)
    {
        if (dept.DeptCode == null)
        {
            return;
        }

        _pendingAction = (dept.DeptCode.Value, "lock");
        OnPropertyChanged(nameof(PagedDepartments));

        try
        {
            var result = await _adminApi.ToggleDeptLockAsync(dept.DeptCode.Value);
            var subject = ToastCopy.Dept(dept.DisplayName);
            var locked = result.ManualLocked || result.Locked;
            ShellToast.Success(locked
                ? ToastCopy.Ok("khóa", "sổ chấm công", subject)
                : ToastCopy.Ok("mở khóa", "sổ chấm công", subject));

            var target = _allDepartments.FirstOrDefault(d => d.DeptCode == dept.DeptCode);
            if (target != null)
            {
                target.Locked = result.Locked;
                target.ManualLocked = result.ManualLocked;
                target.Unlocked = result.Unlocked;
            }

            ApplyPaging(resetPage: false);
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.Fail("khóa", "sổ chấm công", ToastCopy.Dept(dept.DisplayName)));
        }
        finally
        {
            _pendingAction = null;
            ApplyPaging(resetPage: false);
        }
    }

    private async Task ToggleReportBlockAsync(DeptProgressSummary dept)
    {
        if (dept.DeptCode == null || dept.ReportSubmitted)
        {
            return;
        }

        _pendingAction = (dept.DeptCode.Value, "report");

        try
        {
            if (dept.ReportBlocked)
            {
                await _adminApi.UnblockReportAsync(dept.DeptCode.Value);
                ShellToast.Success(ToastCopy.Ok("mở", "chỉnh sửa HEAD", ToastCopy.Dept(dept.DisplayName)));
                dept.ReportBlocked = false;
            }
            else
            {
                await _adminApi.BlockReportAsync(dept.DeptCode.Value, AdminUiStrings.BlockReportReason);
                ShellToast.Success(ToastCopy.Ok("khóa", "chỉnh sửa HEAD", ToastCopy.Dept(dept.DisplayName)));
                dept.ReportBlocked = true;
            }

            ApplyPaging(resetPage: false);
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.Fail("khóa", "chỉnh sửa HEAD", ToastCopy.Dept(dept.DisplayName)));
        }
        finally
        {
            _pendingAction = null;
            ApplyPaging(resetPage: false);
        }
    }

    private static string ExtractMessage(Exception ex) =>
        ex.Message.Trim('"', ' ');
}

public sealed class DeptDetailNavigationRequest
{
    public required int DeptCode { get; init; }
    public required DateOnly Date { get; init; }
}

public sealed class DeptFilterOption(int? deptCode, string label)
{
    public int? DeptCode { get; } = deptCode;
    public string Label { get; } = label;
}

public sealed class ReminderDeptItem : ViewModelBase
{
    public ReminderDeptItem(int deptCode, string displayName, bool hasHead, bool isSelected)
    {
        DeptCode = deptCode;
        DisplayName = displayName;
        HasHead = hasHead;
        _isSelected = isSelected;
    }

    public int DeptCode { get; }
    public string DisplayName { get; }
    public bool HasHead { get; }

    private bool _isSelected;

    public bool IsSelected
    {
        get => _isSelected;
        set => SetProperty(ref _isSelected, value);
    }
}
