using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.App.Views.Admin;
using BV87.App.Views.Attendance;
using BV87.App.Views.Head;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Excel;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin;
using BV87.Core.Models.Attendance;

namespace BV87.App.ViewModels;

public sealed class AdminDeptAttendanceViewModel : ViewModelBase
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private readonly AdminApiClient _adminApi;
    private readonly AttendanceApiClient _attendanceApi;
    private readonly ExcelFileService _excelFileService = new();
    private readonly int? _initialDeptCode;

    private AttendanceSummary? _summary;
    private List<StaffAttendanceRow> _allStaff = [];
    private List<DepartmentListItem> _departments = [];
    private StaffAttendanceRow? _selectedStaff;
    private int? _draftDeptCode;
    private int? _appliedDeptCode;
    private DateOnly _draftDate;
    private DateOnly _appliedDate;
    private string _searchText = string.Empty;
    private string _appliedSearch = string.Empty;
    private string _statusFilter = "Tất cả trạng thái";
    private string _appliedStatusFilter = "Tất cả trạng thái";
    private int _currentPage = 1;
    private int _pageSize = 20;
    private int _totalItems;
    private bool _isLoading;
    private bool _hasListLoaded;
    private bool _isRefreshing;
    private string? _statusMessage;
    private string? _errorMessage;
    private bool _showLockBanner;
    private bool _tableDisabled;

    public AdminDeptAttendanceViewModel(
        AdminApiClient adminApi,
        AttendanceApiClient attendanceApi,
        int? initialDeptCode = null,
        DateOnly? initialDate = null)
    {
        _adminApi = adminApi;
        _attendanceApi = attendanceApi;
        _initialDeptCode = initialDeptCode;
        _draftDeptCode = initialDeptCode;
        _appliedDeptCode = initialDeptCode;
        _draftDate = initialDate ?? AttendanceFormatHelper.TodayVietnam();
        _appliedDate = _draftDate;

        PagedStaff = new ObservableCollection<StaffAttendanceRow>();
        QuickActions = new ObservableCollection<QuickActionItem>();
        StatusFilterOptions = new ObservableCollection<string> { "Tất cả trạng thái", "Chưa chấm" };
        DeptFilterOptions = new ObservableCollection<DeptFilterOption>();

        RefreshCommand = new RelayCommand(async () => await LoadAsync(force: true));
        ApplyFilterCommand = new RelayCommand(async () => await ApplyFilterAsync());
        ResetFilterCommand = new RelayCommand(async () => await ResetFiltersAsync());
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);
        UnlockCommand = new RelayCommand(async () => await UnlockAsync(), CanUnlock);
        RelockCommand = new RelayCommand(async () => await RelockAsync(), CanRelock);
        ApproveUnlockRequestCommand = new RelayCommand(async () => await ApproveUnlockRequestAsync(), CanApproveUnlockRequest);
        RejectUnlockRequestCommand = new RelayCommand(() => RejectUnlockDialogRequested?.Invoke(this, EventArgs.Empty), CanApproveUnlockRequest);
        ExportCommand = new RelayCommand(ExportReport, () => _allStaff.Count > 0 && !IsLoading);
        QuickActionCommand = new RelayCommand<QuickActionItem>(async action =>
        {
            if (action != null)
            {
                await HandleQuickActionAsync(action);
            }
        }, action => action != null && SelectedStaff != null && CanApply(action));

        _ = InitializeAsync();
    }

    public ObservableCollection<StaffAttendanceRow> PagedStaff { get; }
    public ObservableCollection<QuickActionItem> QuickActions { get; }
    public ObservableCollection<string> StatusFilterOptions { get; }
    public ObservableCollection<DeptFilterOption> DeptFilterOptions { get; }

    public ICommand RefreshCommand { get; }
    public ICommand ApplyFilterCommand { get; }
    public ICommand ResetFilterCommand { get; }
    public ICommand GoToPageCommand { get; }
    public ICommand UnlockCommand { get; }
    public ICommand RelockCommand { get; }
    public ICommand ApproveUnlockRequestCommand { get; }
    public ICommand RejectUnlockRequestCommand { get; }
    public ICommand ExportCommand { get; }
    public ICommand QuickActionCommand { get; }

    public event EventHandler? RejectUnlockDialogRequested;

    public int? SelectedDeptFilterDraft
    {
        get => _draftDeptCode;
        set => SetProperty(ref _draftDeptCode, value);
    }

    public DateTime? DraftDatePicker
    {
        get => _draftDate.ToDateTime(TimeOnly.MinValue);
        set
        {
            if (value == null)
            {
                return;
            }

            var next = DateOnly.FromDateTime(value.Value);
            if (_draftDate != next)
            {
                _draftDate = next;
                OnPropertyChanged();
            }
        }
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
        private set
        {
            if (SetProperty(ref _isLoading, value))
            {
                CommandManager.InvalidateRequerySuggested();
            }
        }
    }

    public bool IsRefreshing
    {
        get => _isRefreshing;
        private set => SetProperty(ref _isRefreshing, value);
    }

    public bool ShowLockBanner
    {
        get => _showLockBanner;
        private set => SetProperty(ref _showLockBanner, value);
    }

    public string? LockBannerText { get; private set; }
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

    public string DeptTitle =>
        IsAllDepartments
            ? AdminUiStrings.DeptFilterAll
            : _summary?.DeptNameDisplay ?? _summary?.DeptName
                ?? DeptFilterOptions.FirstOrDefault(d => d.DeptCode == _appliedDeptCode)?.Label
                ?? AdminUiStrings.DeptDetailTitle;

    public string ProgressText => _summary == null
        ? "—"
        : $"Đã chấm {_summary.MarkedCount}/{_summary.Total} ({_summary.ProgressPercent}%) · {(IsAllDepartments ? AdminUiStrings.ProgressScopeHospital : AdminUiStrings.ProgressScope)}";

    public string PageSubtitle => $"{ProgressText} · Ngày {AttendanceDateText}";

    public string AttendanceDateText => _appliedDate.ToString("dd/MM/yyyy");

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
                ApplySearchFilters();
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

    public bool ShowDeptColumn => IsAllDepartments;

    public bool ShowUnlockButton => CanUnlock();
    public bool ShowRelockButton => CanRelock();
    public bool ShowApproveUnlockButton => CanApproveUnlockRequest();

    private bool IsAllDepartments => _appliedDeptCode == null;

    private bool IsAppliedToday => _appliedDate == AttendanceFormatHelper.TodayVietnam();

    private async Task InitializeAsync()
    {
        try
        {
            _departments = await _adminApi.ListDepartmentsAsync();
            DeptFilterOptions.Clear();
            DeptFilterOptions.Add(new DeptFilterOption(null, AdminUiStrings.DeptFilterAll));
            foreach (var dept in _departments.OrderBy(d => d.DeptCode))
            {
                DeptFilterOptions.Add(new DeptFilterOption(dept.DeptCode, dept.DisplayLabel));
            }

            ApplyDefaultDept(_initialDeptCode);

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

    private void ApplyDefaultDept(int? preferredDeptCode)
    {
        if (preferredDeptCode != null)
        {
            var match = _departments.FirstOrDefault(d => d.DeptCode == preferredDeptCode);
            _draftDeptCode = match?.DeptCode;
            _appliedDeptCode = _draftDeptCode;
        }
        else
        {
            _draftDeptCode = null;
            _appliedDeptCode = null;
        }

        OnPropertyChanged(nameof(SelectedDeptFilterDraft));
        OnPropertyChanged(nameof(ShowDeptColumn));
    }

    private async Task ApplyFilterAsync()
    {
        _appliedDeptCode = _draftDeptCode;
        _appliedDate = _draftDate;
        _appliedSearch = SearchText.Trim();
        _appliedStatusFilter = StatusFilter;
        _currentPage = 1;
        OnPropertyChanged(nameof(AttendanceDateText));
        OnPropertyChanged(nameof(ShowDeptColumn));
        UpdateUnlockButtons();
        await LoadAsync(force: true);
    }

    private async Task ResetFiltersAsync()
    {
        _draftDate = AttendanceFormatHelper.TodayVietnam();
        _appliedDate = _draftDate;
        OnPropertyChanged(nameof(DraftDatePicker));
        OnPropertyChanged(nameof(AttendanceDateText));

        ApplyDefaultDept(null);

        _searchText = string.Empty;
        _appliedSearch = string.Empty;
        _statusFilter = "Tất cả trạng thái";
        _appliedStatusFilter = "Tất cả trạng thái";
        OnPropertyChanged(nameof(SearchText));
        OnPropertyChanged(nameof(StatusFilter));
        _currentPage = 1;
        UpdateUnlockButtons();
        await LoadAsync(force: true);
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
            var (summary, staff) = await LoadRosterAsync();
            _summary = summary;
            _allStaff = staff;

            UpdateLockState();
            ApplySearchFilters();

            OnPropertyChanged(nameof(DeptTitle));
            OnPropertyChanged(nameof(ProgressText));
            OnPropertyChanged(nameof(PageSubtitle));
            OnPropertyChanged(nameof(ShowDeptColumn));
            UpdateUnlockButtons();
        }
        catch (ApiException ex)
        {
            ErrorMessage = ex.Message;
        }
        catch (Exception)
        {
            ErrorMessage = "Không tải được dữ liệu Chấm công.";
        }
        finally
        {
            ListLoadBusy.End(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);
            CommandManager.InvalidateRequerySuggested();
        }
    }

    private async Task<(AttendanceSummary? Summary, List<StaffAttendanceRow> Staff)> LoadRosterAsync()
    {
        if (_appliedDeptCode != null)
        {
            var page = await _attendanceApi.GetAttendancePageAsync(_appliedDeptCode.Value, _appliedDate);
            var staff = page.Staff ?? [];
            StampDeptDisplay(staff);
            return (page.Summary, staff);
        }

        if (_departments.Count == 0)
        {
            return (BuildAllDeptSummary(0, 0, 0), []);
        }

        var pages = await Task.WhenAll(
            _departments
                .OrderBy(d => d.DeptCode)
                .Select(d => _attendanceApi.GetAttendancePageAsync(d.DeptCode, _appliedDate)));

        var merged = new List<StaffAttendanceRow>();
        long total = 0;
        long marked = 0;
        long uncheckedCount = 0;
        foreach (var page in pages)
        {
            var staff = page.Staff ?? [];
            StampDeptDisplay(staff);
            merged.AddRange(staff);
            total += page.Summary?.Total ?? staff.Count;
            marked += page.Summary?.MarkedCount ?? 0;
            uncheckedCount += page.Summary?.UncheckedCount ?? 0;
        }

        merged.Sort((a, b) =>
        {
            var dept = (a.DeptCode ?? int.MaxValue).CompareTo(b.DeptCode ?? int.MaxValue);
            return dept != 0 ? dept : a.EmpCode.CompareTo(b.EmpCode);
        });

        return (BuildAllDeptSummary(total, marked, uncheckedCount), merged);
    }

    private AttendanceSummary BuildAllDeptSummary(long total, long marked, long uncheckedCount)
    {
        var percent = total == 0 ? 0 : (int)Math.Round(100d * marked / total);
        return new AttendanceSummary
        {
            AttendanceDate = _appliedDate,
            DeptName = AdminUiStrings.DeptFilterAll,
            DeptNameDisplay = AdminUiStrings.DeptFilterAll,
            Total = total,
            MarkedCount = marked,
            UncheckedCount = uncheckedCount,
            ProgressPercent = percent,
            Editable = true
        };
    }

    private void StampDeptDisplay(IReadOnlyList<StaffAttendanceRow> staff)
    {
        var labels = _departments.ToDictionary(d => d.DeptCode, d => d.DisplayLabel);
        foreach (var row in staff)
        {
            if (row.DeptCode != null && labels.TryGetValue(row.DeptCode.Value, out var label))
            {
                row.DeptDisplay = label;
            }
            else
            {
                row.DeptDisplay = row.DeptCodeFormatted ?? string.Empty;
            }
        }
    }

    private void UpdateLockState()
    {
        if (IsAllDepartments)
        {
            _tableDisabled = false;
            ShowLockBanner = false;
            LockBannerText = null;
            OnPropertyChanged(nameof(LockBannerText));
            CommandManager.InvalidateRequerySuggested();
            return;
        }

        var editable = _summary?.Editable ?? false;
        var reportBlocked = _summary?.ReportBlocked ?? false;
        var isToday = IsAppliedToday;

        var todayWriteDisabled = isToday && !editable;
        _tableDisabled = reportBlocked || (!isToday && !editable);
        ShowLockBanner = _tableDisabled || todayWriteDisabled;
        LockBannerText = _summary?.LockMessage
            ?? (ShowLockBanner ? "Không thể chỉnh sửa dữ liệu trong khung thời gian này." : null);

        OnPropertyChanged(nameof(LockBannerText));
        CommandManager.InvalidateRequerySuggested();
    }

    private void ApplySearchFilters()
    {
        IEnumerable<StaffAttendanceRow> filtered = _allStaff;

        if (!string.IsNullOrWhiteSpace(_appliedSearch))
        {
            var q = _appliedSearch.ToLowerInvariant();
            filtered = filtered.Where(s =>
                s.Fullname.ToLowerInvariant().Contains(q)
                || s.EmpCode.ToString().Contains(q)
                || (s.EmpCodeFormatted ?? "").Contains(q, StringComparison.OrdinalIgnoreCase)
                || (s.PositionName ?? "").ToLowerInvariant().Contains(q)
                || (s.RankName ?? "").ToLowerInvariant().Contains(q)
                || s.DeptDisplay.ToLowerInvariant().Contains(q));
        }

        filtered = _appliedStatusFilter switch
        {
            "Chưa chấm" => filtered.Where(s => s.IsUnchecked),
            "Tất cả trạng thái" => filtered,
            _ => filtered.Where(s => string.Equals(s.StatusLabel, _appliedStatusFilter, StringComparison.OrdinalIgnoreCase)
                || string.Equals(s.DisplayStatus, _appliedStatusFilter, StringComparison.OrdinalIgnoreCase))
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
        ApplySearchFilters();
    }

    private bool CanApply(QuickActionItem action) =>
        SelectedStaff != null
        && StatusCatalogHelper.CanApplyQuickActionAdmin(SelectedStaff, action, _tableDisabled);

    private bool CanUnlock() =>
        _appliedDeptCode != null
        && _appliedDate <= AttendanceFormatHelper.TodayVietnam()
        && _summary is { Unlocked: false };

    private bool CanRelock() =>
        _appliedDeptCode != null
        && _appliedDate <= AttendanceFormatHelper.TodayVietnam()
        && _summary?.Unlocked == true;

    private bool CanApproveUnlockRequest() =>
        _appliedDeptCode != null
        && _appliedDate <= AttendanceFormatHelper.TodayVietnam()
        && string.Equals(_summary?.UnlockRequestStatus, "PENDING", StringComparison.OrdinalIgnoreCase)
        && _summary?.UnlockRequestId != null;

    private void UpdateUnlockButtons()
    {
        OnPropertyChanged(nameof(ShowUnlockButton));
        OnPropertyChanged(nameof(ShowRelockButton));
        OnPropertyChanged(nameof(ShowApproveUnlockButton));
        CommandManager.InvalidateRequerySuggested();
    }

    private async Task UnlockAsync()
    {
        if (_appliedDeptCode == null)
        {
            return;
        }

        var reason = PromptNote(AdminUiStrings.UnlockReasonPrompt);
        if (string.IsNullOrWhiteSpace(reason))
        {
            return;
        }

        try
        {
            await _attendanceApi.UnlockDepartmentAsync(_appliedDeptCode.Value, reason.Trim(), _appliedDate);
            ErrorMessage = null;
            ShellToast.Success(ToastCopy.Ok("mở khóa", $"ngày {AttendanceDateText}", ToastCopy.Dept(DeptTitle)));
            await LoadAsync(force: true);
        }
        catch (ApiException)
        {
            ShellToast.Danger(ToastCopy.Fail("mở khóa", $"ngày {AttendanceDateText}", ToastCopy.Dept(DeptTitle)));
        }
    }

    private async Task RelockAsync()
    {
        if (_appliedDeptCode == null)
        {
            return;
        }

        try
        {
            await _attendanceApi.RelockDepartmentAsync(_appliedDeptCode.Value, _appliedDate);
            ErrorMessage = null;
            ShellToast.Success(ToastCopy.Ok("thu hồi mở khóa", $"ngày {AttendanceDateText}", ToastCopy.Dept(DeptTitle)));
            await LoadAsync(force: true);
        }
        catch (ApiException)
        {
            ShellToast.Danger(ToastCopy.Fail("thu hồi mở khóa", $"ngày {AttendanceDateText}", ToastCopy.Dept(DeptTitle)));
        }
    }

    private async Task ApproveUnlockRequestAsync()
    {
        if (_summary?.UnlockRequestId == null)
        {
            return;
        }

        try
        {
            await _adminApi.ApproveUnlockRequestAsync(_summary.UnlockRequestId.Value);
            ErrorMessage = null;
            ShellToast.Success(ToastCopy.Ok("duyệt", "yêu cầu mở khóa", ToastCopy.Dept(DeptTitle)));
            await LoadAsync(force: true);
        }
        catch (ApiException)
        {
            ShellToast.Danger(ToastCopy.Fail("duyệt", "yêu cầu mở khóa", ToastCopy.Dept(DeptTitle)));
        }
    }

    public async Task RejectUnlockRequestAsync(string? note)
    {
        if (_summary?.UnlockRequestId == null)
        {
            return;
        }

        try
        {
            await _adminApi.RejectUnlockRequestAsync(_summary.UnlockRequestId.Value, note);
            ErrorMessage = null;
            ShellToast.Success(ToastCopy.Ok("từ chối", "yêu cầu mở khóa", ToastCopy.Dept(DeptTitle)));
            await LoadAsync(force: true);
        }
        catch (ApiException)
        {
            ShellToast.Danger(ToastCopy.Fail("từ chối", "yêu cầu mở khóa", ToastCopy.Dept(DeptTitle)));
        }
    }

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

            var wizard = new NghiTrucAssignDialog(staff, _appliedDate)
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
                }, _appliedDate);
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

        var dialog = new ManualRangeDialog(SelectedStaff, action, _appliedDate)
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

    public void OpenManualSchedule(StaffAttendanceRow staff)
    {
        var dialog = new ManualScheduleDialog(_attendanceApi, staff)
        {
            Owner = Application.Current.MainWindow
        };
        dialog.ShowDialog();
    }

    public void OpenScanLogs(StaffAttendanceRow staff)
    {
        var dialog = new ScanLogDialog(_attendanceApi, staff, _appliedDate)
        {
            Owner = Application.Current.MainWindow
        };
        dialog.ShowDialog();
    }

    public void OpenFillTimes(StaffAttendanceRow staff)
    {
        if (!AttendanceActionHelper.CanAdminFillTimes(staff))
        {
            return;
        }

        var dialog = new FillAttendanceTimesDialog(staff, _appliedDate)
        {
            Owner = Application.Current.MainWindow
        };

        if (dialog.ShowDialog() != true || dialog.Result == null)
        {
            return;
        }

        _ = SaveFillTimesAsync(dialog.Result);
    }

    public void OpenApprovePayrollFill(StaffAttendanceRow staff)
    {
        if (!AttendanceActionHelper.CanAdminApprovePayrollFill(staff))
        {
            return;
        }

        var dialog = new ApprovePayrollFillDialog(staff, _appliedDate)
        {
            Owner = Application.Current.MainWindow
        };

        if (dialog.ShowDialog() != true || dialog.Result == null)
        {
            return;
        }

        _ = SaveApprovePayrollFillAsync(dialog.Result);
    }

    public void OpenClearAttendance(StaffAttendanceRow staff)
    {
        if (!AttendanceActionHelper.CanClearAttendance(staff))
        {
            return;
        }

        var dialog = new ClearAttendanceDialog(staff, _appliedDate, _summary?.ReportSubmitted == true)
        {
            Owner = Application.Current.MainWindow
        };

        if (dialog.ShowDialog() != true || dialog.Result == null)
        {
            return;
        }

        _ = SaveClearAttendanceAsync(dialog.Result);
    }

    private void ExportReport()
    {
        ExcelSaveHelper.SaveExcelFile(
            Application.Current.MainWindow,
            DeptAttendanceExcelRegistry.Config.ExportFilename,
            AdminUiStrings.DeptDetailExportReport,
            ExportToFile);
    }

    public void ExportToFile(string filePath)
    {
        var rows = _allStaff.Select(BuildExportRow).ToList();
        _excelFileService.WriteExport(DeptAttendanceExcelRegistry.Config, rows, filePath);
    }

    private IReadOnlyList<object> BuildExportRow(StaffAttendanceRow staff) =>
    [
        staff.Fullname,
        staff.EmpCodeFormatted ?? staff.EmpCode.ToString("00000"),
        staff.RankName ?? string.Empty,
        staff.PositionName ?? string.Empty,
        AttendanceFormatHelper.FormatInstantHm(staff.MorningInAt ?? staff.CheckInAt),
        AttendanceFormatHelper.FormatInstantHm(staff.NoonOutAt),
        AttendanceFormatHelper.FormatInstantHm(staff.AfternoonInAt),
        AttendanceFormatHelper.FormatInstantHm(staff.AfternoonOutAt ?? staff.CheckOutAt),
        staff.DisplayStatus,
        staff.LateFlag ? "+ Đi trễ" : string.Empty,
        AttendanceFormatHelper.FormatKioskMachine(staff),
        staff.Note ?? string.Empty
    ];

    private string StaffSubject(int empCode) =>
        ToastCopy.Staff(_allStaff.FirstOrDefault(s => s.EmpCode == empCode)?.Fullname);

    private async Task SaveFillTimesAsync(FillAttendanceTimesRequest request)
    {
        var subject = StaffSubject(request.EmpCode);
        try
        {
            await _adminApi.FillAttendanceTimesAsync(request);
            ErrorMessage = null;
            ShellToast.Success(ToastCopy.Ok("điền", "giờ chấm công", subject));
            await LoadAsync(force: true);
        }
        catch (ApiException)
        {
            ShellToast.Danger(ToastCopy.Fail("điền", "giờ chấm công", subject));
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.Fail("điền", "giờ chấm công", subject));
        }
    }

    private async Task SaveApprovePayrollFillAsync(PayrollFillApproveRequest request)
    {
        var subject = StaffSubject(request.EmpCode);
        try
        {
            await _adminApi.ApprovePayrollFillAsync(request);
            ErrorMessage = null;
            ShellToast.Success(ToastCopy.Ok("duyệt", "bổ sung giờ", subject));
            await LoadAsync(force: true);
        }
        catch (ApiException)
        {
            ShellToast.Danger(ToastCopy.Fail("duyệt", "bổ sung giờ", subject));
        }
    }

    private async Task SaveClearAttendanceAsync(ClearAttendanceRequest request)
    {
        var subject = StaffSubject(request.EmpCode);
        try
        {
            await _adminApi.ClearAttendanceAsync(request);
            ErrorMessage = null;
            ShellToast.Success(ToastCopy.Ok("đưa về chưa chấm", null, subject));
            await LoadAsync(force: true);
        }
        catch (ApiException)
        {
            ShellToast.Danger(ToastCopy.Fail("đưa về chưa chấm", null, subject));
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.Fail("đưa về chưa chấm", null, subject));
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
}
