using System.Collections.ObjectModel;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Excel;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.ViewModels;

public sealed class DepartmentCatalogViewModel : ViewModelBase
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private readonly AdminApiClient _adminApi;
    private readonly ExcelFileService _excelFileService = new();

    private List<DepartmentCatalogRowViewModel> _allItems = [];
    private List<AdminDepartmentGroupDto> _groups = [];
    private AdminStatsDto? _stats;
    private string _searchDraft = string.Empty;
    private string _searchQuery = string.Empty;
    private int? _groupFilterDraft;
    private int? _groupFilter;
    private int _currentPage = 1;
    private int _pageSize = 20;
    private bool _isLoading;
    private bool _hasListLoaded;
    private bool _isRefreshing;
    private bool _isImporting;
    private string? _statusMessage;
    private string? _errorMessage;

    public DepartmentCatalogViewModel(AdminApiClient adminApi)
    {
        _adminApi = adminApi;
        PagedItems = new ObservableCollection<DepartmentCatalogRowViewModel>();
        GroupFilterOptions = new ObservableCollection<DepartmentGroupFilterOption>();

        RefreshCommand = new RelayCommand(async () => await LoadAsync(force: true));
        ApplyFiltersCommand = new RelayCommand(() => ListLoadBusy.RunRefreshing(v => IsRefreshing = v, ApplyFilters));
        ResetFiltersCommand = new RelayCommand(() => ListLoadBusy.RunRefreshing(v => IsRefreshing = v, ResetFilters));
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);
        AddCommand = new RelayCommand(() => FormRequested?.Invoke(this, null));
        EditCommand = new RelayCommand<DepartmentCatalogRowViewModel>(
            row => FormRequested?.Invoke(this, row),
            row => row != null);
        DeleteCommand = new RelayCommand<DepartmentCatalogRowViewModel>(
            row =>
            {
                if (row != null)
                {
                    DeleteRequested?.Invoke(this, row);
                }
            },
            row => row is { CanDelete: true });
        ManageGroupsCommand = new RelayCommand(() => ManageGroupsRequested?.Invoke(this, EventArgs.Empty));

        _ = LoadAsync(force: false);
    }

    public ObservableCollection<DepartmentCatalogRowViewModel> PagedItems { get; }
    public ObservableCollection<DepartmentGroupFilterOption> GroupFilterOptions { get; }

    public ICommand RefreshCommand { get; }
    public ICommand ApplyFiltersCommand { get; }
    public ICommand ResetFiltersCommand { get; }
    public ICommand GoToPageCommand { get; }
    public ICommand AddCommand { get; }
    public ICommand EditCommand { get; }
    public ICommand DeleteCommand { get; }
    public ICommand ManageGroupsCommand { get; }

    public event EventHandler<DepartmentCatalogRowViewModel?>? FormRequested;
    public event EventHandler<DepartmentCatalogRowViewModel>? DeleteRequested;
    public event EventHandler? ManageGroupsRequested;

    public string PageTitle => CatalogUiStrings.Departments.PageTitle;
    public string NewButtonLabel => CatalogUiStrings.Departments.NewButton;
    public string ManageGroupsLabel => CatalogUiStrings.Departments.ManageGroupsButton;
    public string SearchPlaceholder => CatalogUiStrings.Departments.SearchPlaceholder;
    public string UnitLabel => CatalogUiStrings.Departments.UnitLabel;
    public string GroupFilterLabel => CatalogUiStrings.Departments.GroupFilterLabel;
    public string StatsTotalDeptsLabel => CatalogUiStrings.Departments.StatsTotalDepts;
    public string StatsTotalStaffLabel => CatalogUiStrings.Departments.StatsTotalStaff;
    public string StatsEfficiencyLabel => CatalogUiStrings.Departments.StatsEfficiency;
    public string ColCode => CatalogUiStrings.Departments.ColCode;
    public string ColGroup => CatalogUiStrings.Departments.ColGroup;
    public string ColUnitCode => CatalogUiStrings.Departments.ColUnitCode;
    public string ColName => CatalogUiStrings.Departments.ColName;
    public string ColHead => CatalogUiStrings.Departments.ColHead;
    public string ColStaff => CatalogUiStrings.Departments.ColStaff;

    public string StatsTotalDepts => (_stats?.TotalDepartments ?? _allItems.Count).ToString();
    public string StatsTotalStaff => (_stats?.TotalStaff ?? 0).ToString();
    public string StatsEfficiency => _stats != null ? $"{_stats.ActivePercent:0.#}%" : "—";

    public bool ShowGroupColumn => _groupFilter == null;

    public IReadOnlyList<AdminDepartmentGroupDto> ActiveGroups =>
        _groups.Where(g => g.Active).OrderBy(g => g.SortOrder).ThenBy(g => g.GroupCode).ToList();

    public int? SelectedGroupFilterDraft
    {
        get => _groupFilterDraft;
        set => SetProperty(ref _groupFilterDraft, value);
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

    public ExcelRegistryConfig ExcelConfig => DepartmentExcelRegistry.Config;

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
                ApplyPaging(resetPage: false);
            }
        }
    }

    public IReadOnlyList<int> PageSizeOptions { get; } = DefaultPageSizeOptions;

    public int TotalItems => FilteredItems.Count;

    public int TotalPages => TotalItems == 0
        ? 1
        : (int)Math.Ceiling(TotalItems / (double)_pageSize);

    public bool ShowPagination => true;

    public int? DefaultGroupCodeForForm => _groupFilter;

    private List<DepartmentCatalogRowViewModel> FilteredItems
    {
        get
        {
            IEnumerable<DepartmentCatalogRowViewModel> list = _allItems;
            if (_groupFilter != null)
            {
                list = list.Where(d => d.GroupCode == _groupFilter);
            }

            if (string.IsNullOrWhiteSpace(_searchQuery))
            {
                return list.ToList();
            }

            var query = _searchQuery.Trim().ToLowerInvariant();
            return list.Where(dept =>
                    dept.DeptName.ToLowerInvariant().Contains(query)
                    || dept.DisplayName.ToLowerInvariant().Contains(query)
                    || dept.UnitCode.ToLowerInvariant().Contains(query)
                    || dept.DeptCodeFormatted.ToLowerInvariant().Contains(query)
                    || dept.GroupName.ToLowerInvariant().Contains(query)
                    || (dept.HeadName ?? string.Empty).ToLowerInvariant().Contains(query))
                .ToList();
        }
    }

    public async Task LoadAsync(bool force)
    {
        if (_isLoading && !force)
        {
            return;
        }

        ListLoadBusy.Begin(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);

        ErrorMessage = null;

        try
        {
            var deptTask = _adminApi.ListAdminDepartmentsAsync();
            var groupsTask = _adminApi.ListDepartmentGroupsAsync();
            var statsTask = _adminApi.GetStatsAsync();

            await Task.WhenAll(deptTask, groupsTask, statsTask);

            _allItems = (await deptTask)
                .Select(DepartmentCatalogRowViewModel.FromDto)
                .OrderBy(d => d.DeptCode)
                .ToList();
            _groups = await groupsTask;
            _stats = await statsTask;

            RefreshGroupFilterOptions();
            ApplyPaging(resetPage: force);
            NotifyStatsChanged();
            OnPropertyChanged(nameof(ShowGroupColumn));
            OnPropertyChanged(nameof(ActiveGroups));
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
            _allItems = [];
            ApplyPaging(resetPage: true);
            NotifyStatsChanged();
        }
        finally
        {
            ListLoadBusy.End(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);
        }
    }

    public async Task SaveDepartmentAsync(DepartmentUpsertRequest request, int? editDeptCode)
    {
        ErrorMessage = null;

        try
        {
            if (editDeptCode != null)
            {
                await _adminApi.UpdateDepartmentAsync(editDeptCode.Value, request);
                ShellToast.Success(ToastCopy.OkItem("cập nhật", ToastCopy.Dept(request.DeptName)));
            }
            else
            {
                await _adminApi.CreateDepartmentAsync(request);
                ShellToast.Success(ToastCopy.OkItem("thêm", ToastCopy.Dept(request.DeptName)));
            }

            await LoadAsync(force: true);
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
            throw;
        }
    }

    public async Task DeleteDepartmentAsync(DepartmentCatalogRowViewModel row)
    {
        ErrorMessage = null;

        try
        {
            await _adminApi.DeleteDepartmentAsync(row.DeptCode);
            ShellToast.Success(ToastCopy.OkItem("xóa", ToastCopy.Dept(row.DisplayName)));
            await LoadAsync(force: true);
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.FailItem("xóa", ToastCopy.Dept(row.DisplayName)));
        }
    }

    public void DownloadTemplate(string filePath)
    {
        _excelFileService.WriteTemplate(ExcelConfig, filePath);
    }

    public void ExportToFile(string filePath)
    {
        var rows = FilteredItems.Select(BuildExportRow).ToList();
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
            var staffPage = await _adminApi.ListStaffPageAsync(page: 1, pageSize: 500);
            var context = new DepartmentExcelImportContext
            {
                Groups = _groups,
                StaffList = staffPage.Items
            };

            var result = await ExcelImportRunner.RunAsync(
                _excelFileService,
                filePath,
                ExcelConfig.TemplateHeaders,
                rows => DepartmentExcelImportMapper.MapRows(rows, context),
                payload => _adminApi.CreateDepartmentAsync(new DepartmentUpsertRequest
                {
                    GroupCode = payload.GroupCode,
                    DeptName = payload.DeptName,
                    Location = null,
                    HeadEmpCode = payload.HeadEmpCode,
                    LocationImageUrl = null
                }),
                CatalogUiStrings.Departments.UnitLabel);

            ShellToast.FromImport(result);

            if (result.ShouldReload)
            {
                await LoadAsync(force: true);
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

    private static IReadOnlyList<object> BuildExportRow(DepartmentCatalogRowViewModel item)
    {
        var head = "—";
        if (!string.IsNullOrWhiteSpace(item.HeadName))
        {
            head = !string.IsNullOrWhiteSpace(item.HeadRank)
                ? $"{item.HeadName}\n{item.HeadRank}"
                : item.HeadName!;
        }

        return
        [
            string.IsNullOrWhiteSpace(item.GroupName) ? "—" : item.GroupName,
            item.DeptName,
            head,
            item.StaffCount
        ];
    }

    public async Task<List<AdminStaffDto>> LoadStaffForDeptAsync(int deptCode)
    {
        var page = await _adminApi.ListStaffPageAsync(deptCode: deptCode, page: 1, pageSize: 500);
        return page.Items.Where(s => s.Active).ToList();
    }

    public async Task SaveGroupAsync(DepartmentGroupUpsertRequest request, int? editGroupCode)
    {
        if (editGroupCode != null)
        {
            await _adminApi.UpdateDepartmentGroupAsync(editGroupCode.Value, request);
            ShellToast.Success(ToastCopy.OkItem("cập nhật", $"nhóm {request.GroupName}"));
        }
        else
        {
            await _adminApi.CreateDepartmentGroupAsync(request);
            ShellToast.Success(ToastCopy.OkItem("thêm", $"nhóm {request.GroupName}"));
        }

        await LoadAsync(force: true);
    }

    public async Task DeleteGroupAsync(DepartmentGroupRowViewModel row)
    {
        await _adminApi.DeleteDepartmentGroupAsync(row.GroupCode);
        ShellToast.Success(ToastCopy.OkItem("xóa", $"nhóm {row.GroupName ?? row.GroupCodeFormatted ?? row.GroupCode.ToString()}"));
        await LoadAsync(force: true);
    }

    public List<DepartmentGroupRowViewModel> GetGroupRows() =>
        _groups.Select(DepartmentGroupRowViewModel.FromDto).OrderBy(g => g.SortOrder).ThenBy(g => g.GroupCode).ToList();

    private void RefreshGroupFilterOptions()
    {
        GroupFilterOptions.Clear();
        GroupFilterOptions.Add(new DepartmentGroupFilterOption(null, CatalogUiStrings.Departments.GroupFilterAll));
        foreach (var group in _groups.Where(g => g.Active).OrderBy(g => g.SortOrder).ThenBy(g => g.GroupCode))
        {
            GroupFilterOptions.Add(new DepartmentGroupFilterOption(
                group.GroupCode,
                group.GroupName ?? group.GroupCodeFormatted ?? group.GroupCode.ToString()));
        }
    }

    private void ApplyFilters()
    {
        _searchQuery = SearchDraft;
        _groupFilter = _groupFilterDraft;
        _currentPage = 1;
        ApplyPaging(resetPage: true);
        OnPropertyChanged(nameof(ShowGroupColumn));
    }

    private void ResetFilters()
    {
        _searchDraft = string.Empty;
        _searchQuery = string.Empty;
        _groupFilterDraft = null;
        _groupFilter = null;
        OnPropertyChanged(nameof(SearchDraft));
        OnPropertyChanged(nameof(SelectedGroupFilterDraft));
        _currentPage = 1;
        ApplyPaging(resetPage: true);
        OnPropertyChanged(nameof(ShowGroupColumn));
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

        PagedItems.Clear();
        var startIndex = (_currentPage - 1) * _pageSize;
        var pageSlice = FilteredItems.Skip(startIndex).Take(_pageSize).ToList();
        for (var i = 0; i < pageSlice.Count; i++)
        {
            pageSlice[i].RowNumber = startIndex + i + 1;
            PagedItems.Add(pageSlice[i]);
        }

        OnPropertyChanged(nameof(CurrentPage));
        OnPropertyChanged(nameof(TotalPages));
        OnPropertyChanged(nameof(TotalItems));
        OnPropertyChanged(nameof(ShowPagination));
    }

    private void NotifyStatsChanged()
    {
        OnPropertyChanged(nameof(StatsTotalDepts));
        OnPropertyChanged(nameof(StatsTotalStaff));
        OnPropertyChanged(nameof(StatsEfficiency));
    }

    private static string ExtractMessage(Exception ex) =>
        ex.Message.Trim('"', ' ');
}
