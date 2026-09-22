using System.Collections.ObjectModel;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Excel;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.ViewModels;

public sealed class StaffCatalogViewModel : ViewModelBase
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];
    private const int ExportPageSize = 500;

    private readonly AdminApiClient _adminApi;
    private readonly ExcelFileService _excelFileService = new();

    private AdminStatsDto? _stats;
    private List<AdminDepartmentDto> _departments = [];
    private List<string> _rankNames = [];
    private List<string> _positionNames = [];
    private string _searchDraft = string.Empty;
    private string _searchQuery = string.Empty;
    private int? _deptFilterDraft;
    private int? _deptFilter;
    private bool? _activeFilterDraft;
    private bool? _activeFilter;
    private int _currentPage = 1;
    private int _pageSize = 20;
    private int _totalPages = 1;
    private long _totalItems;
    private bool _isLoading;
    private bool _hasListLoaded;
    private bool _isRefreshing;
    private bool _isImporting;
    private string? _statusMessage;
    private string? _errorMessage;

    public StaffCatalogViewModel(AdminApiClient adminApi)
    {
        _adminApi = adminApi;
        PagedItems = new ObservableCollection<StaffCatalogRowViewModel>();
        DeptFilterOptions = new ObservableCollection<StaffDeptFilterOption>();
        ActiveFilterOptions = new ObservableCollection<StaffActiveFilterOption>
        {
            new(null, CatalogUiStrings.Staff.ActiveFilterAll),
            new(true, CatalogUiStrings.Staff.Active),
            new(false, CatalogUiStrings.Staff.Inactive)
        };

        RefreshCommand = new RelayCommand(async () => await LoadAsync(force: true));
        ApplyFiltersCommand = new RelayCommand(async () => await ApplyFiltersAsync());
        ResetFiltersCommand = new RelayCommand(async () => await ResetFiltersAsync());
        GoToPageCommand = new RelayCommand<int>(
            async page => await ChangePageAsync(page),
            page => page >= 1 && page <= TotalPages);
        AddCommand = new RelayCommand(() => FormRequested?.Invoke(this, null));
        EditCommand = new RelayCommand<StaffCatalogRowViewModel>(
            row => FormRequested?.Invoke(this, row),
            row => row != null);
        TransferCommand = new RelayCommand<StaffCatalogRowViewModel>(
            row =>
            {
                if (row != null)
                {
                    TransferRequested?.Invoke(this, row);
                }
            },
            row => row != null);
        HistoryCommand = new RelayCommand<StaffCatalogRowViewModel>(
            row =>
            {
                if (row != null)
                {
                    HistoryRequested?.Invoke(this, row);
                }
            },
            row => row != null);
        DeleteCommand = new RelayCommand<StaffCatalogRowViewModel>(
            row =>
            {
                if (row != null)
                {
                    DeleteRequested?.Invoke(this, row);
                }
            },
            row => row is { Active: true });
        DeleteFingerprintCommand = new RelayCommand<StaffCatalogRowViewModel>(
            row =>
            {
                if (row != null)
                {
                    DeleteFingerprintRequested?.Invoke(this, row);
                }
            },
            row => row is { FingerprintRegistered: true });

        _ = InitializeAsync();
    }

    public ObservableCollection<StaffCatalogRowViewModel> PagedItems { get; }
    public ObservableCollection<StaffDeptFilterOption> DeptFilterOptions { get; }
    public ObservableCollection<StaffActiveFilterOption> ActiveFilterOptions { get; }

    public ICommand RefreshCommand { get; }
    public ICommand ApplyFiltersCommand { get; }
    public ICommand ResetFiltersCommand { get; }
    public ICommand GoToPageCommand { get; }
    public ICommand AddCommand { get; }
    public ICommand EditCommand { get; }
    public ICommand TransferCommand { get; }
    public ICommand HistoryCommand { get; }
    public ICommand DeleteCommand { get; }
    public ICommand DeleteFingerprintCommand { get; }

    public event EventHandler<StaffCatalogRowViewModel?>? FormRequested;
    public event EventHandler<StaffCatalogRowViewModel>? TransferRequested;
    public event EventHandler<StaffCatalogRowViewModel>? HistoryRequested;
    public event EventHandler<StaffCatalogRowViewModel>? DeleteRequested;
    public event EventHandler<StaffCatalogRowViewModel>? DeleteFingerprintRequested;

    public string PageTitle => CatalogUiStrings.Staff.PageTitle;
    public string NewButtonLabel => CatalogUiStrings.Staff.NewButton;
    public string UnitLabel => CatalogUiStrings.Staff.UnitLabel;
    public string DeptFilterLabel => CatalogUiStrings.Staff.DeptFilterLabel;
    public string ActiveFilterLabel => CatalogUiStrings.Staff.ActiveFilterLabel;
    public string StatsTotalLabel => CatalogUiStrings.Staff.StatsTotal;
    public string StatsActiveLabel => CatalogUiStrings.Staff.StatsActive;
    public string StatsInactiveLabel => CatalogUiStrings.Staff.StatsInactive;
    public string ColDept => CatalogUiStrings.Staff.ColDept;
    public string ColCode => CatalogUiStrings.Staff.ColCode;
    public string ColName => CatalogUiStrings.Staff.ColName;
    public string ColRank => CatalogUiStrings.Staff.ColRank;
    public string ColPosition => CatalogUiStrings.Staff.ColPosition;
    public string ColStatus => CatalogUiStrings.Staff.ColStatus;
    public string ColFingerprint => CatalogUiStrings.Staff.ColFingerprint;

    public string StatsTotal => (_stats?.TotalStaff ?? 0).ToString();
    public string StatsActive => (_stats?.ActiveStaff ?? 0).ToString();
    public string StatsInactive => _stats != null ? (_stats.TotalStaff - _stats.ActiveStaff).ToString() : "—";

    public IReadOnlyList<AdminDepartmentDto> ActiveDepartments =>
        _departments.Where(d => d.Active).OrderBy(d => d.DeptCode).ToList();

    public IReadOnlyList<string> RankNames => _rankNames;
    public IReadOnlyList<string> PositionNames => _positionNames;

    public int? SelectedDeptFilterDraft
    {
        get => _deptFilterDraft;
        set => SetProperty(ref _deptFilterDraft, value);
    }

    public bool? SelectedActiveFilterDraft
    {
        get => _activeFilterDraft;
        set => SetProperty(ref _activeFilterDraft, value);
    }

    public string SearchDraft
    {
        get => _searchDraft;
        set => SetProperty(ref _searchDraft, value);
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

    public bool IsImporting
    {
        get => _isImporting;
        private set => SetProperty(ref _isImporting, value);
    }

    public ExcelRegistryConfig ExcelConfig => StaffExcelRegistry.Config;

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
                _ = ChangePageAsync(1);
            }
        }
    }

    public IReadOnlyList<int> PageSizeOptions { get; } = DefaultPageSizeOptions;

    public long TotalItems => _totalItems;

    public int TotalPages => Math.Max(1, _totalPages);

    public bool ShowPagination => true;

    private async Task InitializeAsync()
    {
        await LoadReferenceDataAsync();
        await LoadPageAsync(resetPage: true, showFullLoading: true);
    }

    public async Task LoadAsync(bool force)
    {
        await LoadReferenceDataAsync();
        await LoadPageAsync(resetPage: force, showFullLoading: !_hasListLoaded);
    }

    private async Task LoadReferenceDataAsync()
    {
        try
        {
            var deptTask = _adminApi.ListAdminDepartmentsAsync();
            var statsTask = _adminApi.GetStatsAsync();
            var ranksTask = _adminApi.ListStaffRanksAsync();
            var positionsTask = _adminApi.ListStaffPositionsAsync();

            await Task.WhenAll(deptTask, statsTask, ranksTask, positionsTask);

            _departments = await deptTask;
            _stats = await statsTask;
            _rankNames = (await ranksTask)
                .Where(r => r.Active)
                .OrderBy(r => r.SortOrder)
                .Select(r => r.RankName ?? string.Empty)
                .Where(n => !string.IsNullOrWhiteSpace(n))
                .Distinct()
                .ToList();
            _positionNames = (await positionsTask)
                .Where(p => p.Active)
                .OrderBy(p => p.SortOrder)
                .Select(p => p.PositionName ?? string.Empty)
                .Where(n => !string.IsNullOrWhiteSpace(n))
                .Distinct()
                .ToList();

            RefreshDeptFilterOptions();
            NotifyStatsChanged();
            OnPropertyChanged(nameof(ActiveDepartments));
            OnPropertyChanged(nameof(RankNames));
            OnPropertyChanged(nameof(PositionNames));
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
        }
    }

    private async Task LoadPageAsync(bool resetPage, bool showFullLoading)
    {
        if (resetPage)
        {
            _currentPage = 1;
        }

        if (showFullLoading)
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
            var result = await _adminApi.ListStaffPageAsync(
                search: _searchQuery,
                deptCode: _deptFilter,
                active: _activeFilter,
                page: _currentPage,
                pageSize: _pageSize);

            _totalItems = result.TotalItems;
            _totalPages = Math.Max(1, result.TotalPages);
            if (_currentPage > _totalPages)
            {
                _currentPage = _totalPages;
                if (_currentPage != result.Page)
                {
                    await LoadPageAsync(resetPage: false, showFullLoading: false);
                    return;
                }
            }

            PagedItems.Clear();
            var startIndex = (_currentPage - 1) * _pageSize;
            for (var i = 0; i < result.Items.Count; i++)
            {
                var row = StaffCatalogRowViewModel.FromDto(result.Items[i]);
                row.RowNumber = startIndex + i + 1;
                PagedItems.Add(row);
            }

            NotifyPagingChanged();
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
            PagedItems.Clear();
            _totalItems = 0;
            _totalPages = 1;
            NotifyPagingChanged();
        }
        finally
        {
            _hasListLoaded = true;
            IsLoading = false;
            IsRefreshing = false;
        }
    }

    public async Task SaveStaffAsync(StaffUpsertRequest request, int? editEmpCode)
    {
        ErrorMessage = null;

        try
        {
            if (editEmpCode != null)
            {
                await _adminApi.UpdateStaffAsync(editEmpCode.Value, request);
                ShellToast.Success(request.RevokeHeadOnTransfer == true
                    ? ToastCopy.Ok("chuyển", "đơn vị và thu hồi quyền trưởng", ToastCopy.Staff(request.Fullname))
                    : !string.IsNullOrWhiteSpace(request.TransferReason)
                        ? ToastCopy.Ok("chuyển", "đơn vị", ToastCopy.Staff(request.Fullname))
                        : ToastCopy.OkItem("cập nhật", ToastCopy.Staff(request.Fullname)));
            }
            else
            {
                await _adminApi.CreateStaffAsync(request);
                ShellToast.Success(ToastCopy.OkItem("thêm", ToastCopy.Staff(request.Fullname)));
            }

            await LoadReferenceDataAsync();
            await LoadPageAsync(resetPage: editEmpCode == null, showFullLoading: false);
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
            throw;
        }
    }

    public async Task TransferStaffAsync(int empCode, StaffTransferRequest request, string? staffName)
    {
        ErrorMessage = null;

        try
        {
            await _adminApi.TransferStaffAsync(empCode, request);
            ShellToast.Success(request.RevokeHeadOnTransfer == true
                ? ToastCopy.Ok("chuyển", "đơn vị và thu hồi quyền trưởng", ToastCopy.Staff(staffName))
                : ToastCopy.Ok("chuyển", "đơn vị", ToastCopy.Staff(staffName)));
            await LoadReferenceDataAsync();
            await LoadPageAsync(resetPage: false, showFullLoading: false);
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
            throw;
        }
    }

    public async Task DeleteStaffAsync(StaffCatalogRowViewModel row)
    {
        ErrorMessage = null;

        try
        {
            var result = await _adminApi.DeleteStaffAsync(row.EmpCode);
            var message = string.IsNullOrWhiteSpace(result.Message)
                ? CatalogUiStrings.Staff.FlashDelete(row.Fullname)
                : result.Message.Trim();
            ShellToast.Success(message);
            await LoadReferenceDataAsync();
            await LoadPageAsync(resetPage: false, showFullLoading: false);
        }
        catch (Exception ex)
        {
            ShellToast.Danger(ExtractMessage(ex));
        }
    }

    public async Task DeleteFingerprintAsync(StaffCatalogRowViewModel row)
    {
        ErrorMessage = null;
        StatusMessage = null;

        try
        {
            await _adminApi.DeleteStaffFingerprintAsync(row.EmpCode);
            ShellToast.Success(ToastCopy.Ok("xóa", "vân tay", ToastCopy.Staff(row.Fullname)));
            await LoadPageAsync(resetPage: false, showFullLoading: false);
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.Fail("xóa", "vân tay", ToastCopy.Staff(row.Fullname)));
        }
    }

    public Task<List<StaffDepartmentAssignmentDto>> LoadTransferHistoryAsync(int empCode) =>
        _adminApi.GetStaffDepartmentHistoryAsync(empCode);

    public void DownloadTemplate(string filePath)
    {
        _excelFileService.WriteTemplate(ExcelConfig, filePath);
    }

    public void ExportToFile(string filePath)
    {
        var items = FetchAllFilteredForExportAsync().GetAwaiter().GetResult();
        var rows = items.Select(BuildExportRow).ToList();
        _excelFileService.WriteExport(ExcelConfig, rows, filePath);
    }

    public async Task ImportFromFileAsync(string filePath)
    {
        if (_isImporting)
        {
            return;
        }

        IsImporting = true;
        ErrorMessage = null;
        StatusMessage = null;

        try
        {
            var context = new StaffExcelImportContext
            {
                Departments = _departments,
                RankNames = _rankNames,
                PositionNames = _positionNames
            };

            var result = await ExcelImportRunner.RunAsync(
                _excelFileService,
                filePath,
                ExcelConfig.TemplateHeaders,
                rows => StaffExcelImportMapper.MapRows(rows, context),
                payload => _adminApi.CreateStaffAsync(new StaffUpsertRequest
                {
                    Fullname = payload.Fullname,
                    DeptCode = payload.DeptCode,
                    RankName = payload.RankName,
                    PositionName = payload.PositionName,
                    Active = payload.Active,
                    AvatarUrl = null
                }),
                CatalogUiStrings.Staff.UnitLabel);

            ShellToast.FromImport(result);

            if (result.ShouldReload)
            {
                await LoadReferenceDataAsync();
                await LoadPageAsync(resetPage: false, showFullLoading: false);
            }
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.FailItem("import", "file Excel"));
        }
        finally
        {
            IsImporting = false;
        }
    }

    private async Task<List<AdminStaffDto>> FetchAllFilteredForExportAsync()
    {
        var all = new List<AdminStaffDto>();
        var page = 1;
        int totalPages;

        do
        {
            var result = await _adminApi.ListStaffPageAsync(
                search: _searchQuery,
                deptCode: _deptFilter,
                active: _activeFilter,
                page: page,
                pageSize: ExportPageSize);

            all.AddRange(result.Items);
            totalPages = Math.Max(1, result.TotalPages);
            page++;
        } while (page <= totalPages);

        return all;
    }

    private static IReadOnlyList<object> BuildExportRow(AdminStaffDto item)
    {
        var deptDisplay = DeptDisplayFormatter.Format(item.UnitCode, item.DeptName, item.DeptCodeFormatted);

        return
        [
            item.EmpCodeFormatted ?? item.EmpCode.ToString("D5"),
            deptDisplay,
            item.Fullname ?? string.Empty,
            string.IsNullOrWhiteSpace(item.RankName) ? "—" : item.RankName,
            string.IsNullOrWhiteSpace(item.PositionName) ? "—" : item.PositionName,
            item.Active ? CatalogUiStrings.Staff.Active : CatalogUiStrings.Staff.Inactive
        ];
    }

    private async Task ApplyFiltersAsync()
    {
        _searchQuery = SearchDraft;
        _deptFilter = _deptFilterDraft;
        _activeFilter = _activeFilterDraft;
        await LoadPageAsync(resetPage: true, showFullLoading: false);
    }

    private async Task ResetFiltersAsync()
    {
        _searchDraft = string.Empty;
        _searchQuery = string.Empty;
        _deptFilterDraft = null;
        _deptFilter = null;
        _activeFilterDraft = null;
        _activeFilter = null;
        OnPropertyChanged(nameof(SearchDraft));
        OnPropertyChanged(nameof(SelectedDeptFilterDraft));
        OnPropertyChanged(nameof(SelectedActiveFilterDraft));
        await LoadPageAsync(resetPage: true, showFullLoading: false);
    }

    private async Task ChangePageAsync(int page)
    {
        if (page < 1 || page > TotalPages)
        {
            return;
        }

        _currentPage = page;
        await LoadPageAsync(resetPage: false, showFullLoading: false);
    }

    private void RefreshDeptFilterOptions()
    {
        DeptFilterOptions.Clear();
        DeptFilterOptions.Add(new StaffDeptFilterOption(null, CatalogUiStrings.Staff.DeptFilterAll));
        foreach (var dept in _departments.Where(d => d.Active).OrderBy(d => d.DeptCode))
        {
            DeptFilterOptions.Add(new StaffDeptFilterOption(dept.DeptCode, dept.DisplayLabel));
        }
    }

    private void NotifyPagingChanged()
    {
        OnPropertyChanged(nameof(CurrentPage));
        OnPropertyChanged(nameof(TotalPages));
        OnPropertyChanged(nameof(TotalItems));
        OnPropertyChanged(nameof(ShowPagination));
    }

    private void NotifyStatsChanged()
    {
        OnPropertyChanged(nameof(StatsTotal));
        OnPropertyChanged(nameof(StatsActive));
        OnPropertyChanged(nameof(StatsInactive));
    }

    private static string ExtractMessage(Exception ex) =>
        ex.Message.Trim('"', ' ');
}
