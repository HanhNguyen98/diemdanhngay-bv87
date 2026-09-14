using System.Collections.ObjectModel;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Excel;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.ViewModels;

public sealed class StaffAttributeCatalogViewModel : ViewModelBase
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private readonly AdminApiClient _adminApi;
    private readonly ExcelFileService _excelFileService = new();
    private readonly StaffAttributeCatalogKind _kind;

    private List<StaffAttributeCatalogRowViewModel> _allItems = [];
    private string _searchDraft = string.Empty;
    private string _searchQuery = string.Empty;
    private int _currentPage = 1;
    private int _pageSize = 20;
    private bool _isLoading;
    private bool _hasListLoaded;
    private bool _isRefreshing;
    private bool _isImporting;
    private string? _statusMessage;
    private string? _errorMessage;

    public StaffAttributeCatalogViewModel(AdminApiClient adminApi, StaffAttributeCatalogKind kind)
    {
        _adminApi = adminApi;
        _kind = kind;

        PagedItems = new ObservableCollection<StaffAttributeCatalogRowViewModel>();

        RefreshCommand = new RelayCommand(async () => await LoadAsync(force: true));
        ApplySearchCommand = new RelayCommand(() => ListLoadBusy.RunRefreshing(v => IsRefreshing = v, ApplySearch));
        ResetFiltersCommand = new RelayCommand(() => ListLoadBusy.RunRefreshing(v => IsRefreshing = v, ResetFilters));
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);
        AddCommand = new RelayCommand(() => FormRequested?.Invoke(this, null));
        EditCommand = new RelayCommand<StaffAttributeCatalogRowViewModel>(
            row => FormRequested?.Invoke(this, row),
            row => row != null);
        DeleteCommand = new RelayCommand<StaffAttributeCatalogRowViewModel>(
            row =>
            {
                if (row != null)
                {
                    DeleteRequested?.Invoke(this, row);
                }
            },
            row => row is { CanDelete: true });

        _ = LoadAsync(force: false);
    }

    public ObservableCollection<StaffAttributeCatalogRowViewModel> PagedItems { get; }

    public ICommand RefreshCommand { get; }
    public ICommand ApplySearchCommand { get; }
    public ICommand ResetFiltersCommand { get; }
    public ICommand GoToPageCommand { get; }
    public ICommand AddCommand { get; }
    public ICommand EditCommand { get; }
    public ICommand DeleteCommand { get; }

    public event EventHandler<StaffAttributeCatalogRowViewModel?>? FormRequested;
    public event EventHandler<StaffAttributeCatalogRowViewModel>? DeleteRequested;

    public string PageTitle => _kind == StaffAttributeCatalogKind.Rank
        ? CatalogUiStrings.Ranks.PageTitle
        : CatalogUiStrings.Positions.PageTitle;

    public string NewButtonLabel => _kind == StaffAttributeCatalogKind.Rank
        ? CatalogUiStrings.Ranks.NewButton
        : CatalogUiStrings.Positions.NewButton;

    public string SearchPlaceholder => _kind == StaffAttributeCatalogKind.Rank
        ? CatalogUiStrings.Ranks.SearchPlaceholder
        : CatalogUiStrings.Positions.SearchPlaceholder;

    public string UnitLabel => _kind == StaffAttributeCatalogKind.Rank
        ? CatalogUiStrings.Ranks.UnitLabel
        : CatalogUiStrings.Positions.UnitLabel;

    public string StatsTotalLabel => _kind == StaffAttributeCatalogKind.Rank
        ? CatalogUiStrings.Ranks.StatsTotal
        : CatalogUiStrings.Positions.StatsTotal;

    public string StatsActiveLabel => _kind == StaffAttributeCatalogKind.Rank
        ? CatalogUiStrings.Ranks.StatsActive
        : CatalogUiStrings.Positions.StatsActive;

    public string StatsInactiveLabel => _kind == StaffAttributeCatalogKind.Rank
        ? CatalogUiStrings.Ranks.StatsInactive
        : CatalogUiStrings.Positions.StatsInactive;

    public string ColCode => _kind == StaffAttributeCatalogKind.Rank
        ? CatalogUiStrings.Ranks.ColCode
        : CatalogUiStrings.Positions.ColCode;

    public string ColName => _kind == StaffAttributeCatalogKind.Rank
        ? CatalogUiStrings.Ranks.ColName
        : CatalogUiStrings.Positions.ColName;

    public string ColSort => CatalogUiStrings.Ranks.ColSort;

    public string ColUsage => CatalogUiStrings.Ranks.ColUsage;

    public string ColStatus => CatalogUiStrings.Ranks.ColStatus;

    public int StatsTotal => _allItems.Count;

    public int StatsActive => _allItems.Count(i => i.Active);

    public int StatsInactive => _allItems.Count(i => !i.Active);

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

    public ExcelRegistryConfig ExcelConfig => _kind == StaffAttributeCatalogKind.Rank
        ? StaffAttributeExcelRegistry.Rank
        : StaffAttributeExcelRegistry.Position;

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

    private List<StaffAttributeCatalogRowViewModel> FilteredItems
    {
        get
        {
            if (string.IsNullOrWhiteSpace(_searchQuery))
            {
                return _allItems;
            }

            var query = _searchQuery.Trim().ToLowerInvariant();
            return _allItems.Where(item =>
                    item.Name.ToLowerInvariant().Contains(query)
                    || item.CodeFormatted.ToLowerInvariant().Contains(query)
                    || item.Code.ToString().Contains(query))
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
            _allItems = _kind == StaffAttributeCatalogKind.Rank
                ? (await _adminApi.ListStaffRanksAsync())
                .Select(StaffAttributeCatalogRowViewModel.FromRank)
                .OrderBy(i => i.SortOrder)
                .ThenBy(i => i.Code)
                .ToList()
                : (await _adminApi.ListStaffPositionsAsync())
                .Select(StaffAttributeCatalogRowViewModel.FromPosition)
                .OrderBy(i => i.SortOrder)
                .ThenBy(i => i.Code)
                .ToList();

            ApplyPaging(resetPage: force);
            NotifyStatsChanged();
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

    public async Task SaveItemAsync(string name, int? sortOrder, bool active, int? editCode)
    {
        ErrorMessage = null;

        try
        {
            if (_kind == StaffAttributeCatalogKind.Rank)
            {
                var request = new StaffRankUpsertRequest
                {
                    RankName = name,
                    SortOrder = sortOrder,
                    Active = active
                };

                if (editCode != null)
                {
                    await _adminApi.UpdateStaffRankAsync(editCode.Value, request);
                    ShellToast.Success(ToastCopy.OkItem("cập nhật", $"cấp bậc {name}"));
                }
                else
                {
                    await _adminApi.CreateStaffRankAsync(request);
                    ShellToast.Success(ToastCopy.OkItem("thêm", $"cấp bậc {name}"));
                }
            }
            else
            {
                var request = new StaffPositionUpsertRequest
                {
                    PositionName = name,
                    SortOrder = sortOrder,
                    Active = active
                };

                if (editCode != null)
                {
                    await _adminApi.UpdateStaffPositionAsync(editCode.Value, request);
                    ShellToast.Success(ToastCopy.OkItem("cập nhật", $"chức vụ {name}"));
                }
                else
                {
                    await _adminApi.CreateStaffPositionAsync(request);
                    ShellToast.Success(ToastCopy.OkItem("thêm", $"chức vụ {name}"));
                }
            }

            await LoadAsync(force: true);
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
            throw;
        }
    }

    public async Task DeleteItemAsync(StaffAttributeCatalogRowViewModel row)
    {
        ErrorMessage = null;

        try
        {
            if (_kind == StaffAttributeCatalogKind.Rank)
            {
                await _adminApi.DeleteStaffRankAsync(row.Code);
                ShellToast.Success(ToastCopy.OkItem("xóa", $"cấp bậc {row.Name}"));
            }
            else
            {
                await _adminApi.DeleteStaffPositionAsync(row.Code);
                ShellToast.Success(ToastCopy.OkItem("xóa", $"chức vụ {row.Name}"));
            }

            await LoadAsync(force: true);
        }
        catch (Exception)
        {
            var item = _kind == StaffAttributeCatalogKind.Rank
                ? $"cấp bậc {row.Name}"
                : $"chức vụ {row.Name}";
            ShellToast.Danger(ToastCopy.FailItem("xóa", item));
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
            var result = await ExcelImportRunner.RunAsync(
                _excelFileService,
                filePath,
                ExcelConfig.TemplateHeaders,
                rows => _kind == StaffAttributeCatalogKind.Rank
                    ? StaffAttributeExcelImportMapper.MapRankRows(rows)
                    : StaffAttributeExcelImportMapper.MapPositionRows(rows),
                async payload =>
                {
                    if (_kind == StaffAttributeCatalogKind.Rank)
                    {
                        await _adminApi.CreateStaffRankAsync(new StaffRankUpsertRequest
                        {
                            RankName = payload.Name,
                            SortOrder = payload.SortOrder,
                            Active = payload.Active
                        });
                    }
                    else
                    {
                        await _adminApi.CreateStaffPositionAsync(new StaffPositionUpsertRequest
                        {
                            PositionName = payload.Name,
                            SortOrder = payload.SortOrder,
                            Active = payload.Active
                        });
                    }
                },
                _kind == StaffAttributeCatalogKind.Rank
                    ? CatalogUiStrings.Ranks.UnitLabel
                    : CatalogUiStrings.Positions.UnitLabel);

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

    private IReadOnlyList<object> BuildExportRow(StaffAttributeCatalogRowViewModel item) =>
    [
        item.CodeFormatted,
        item.Name,
        item.SortOrder,
        item.UsageCount,
        item.Active ? CatalogUiStrings.Active : CatalogUiStrings.Inactive
    ];

    public string GetDeleteTitle() => _kind == StaffAttributeCatalogKind.Rank
        ? CatalogUiStrings.Ranks.DeleteTitle
        : CatalogUiStrings.Positions.DeleteTitle;

    public string GetDeleteMessage(string name) => _kind == StaffAttributeCatalogKind.Rank
        ? CatalogUiStrings.Ranks.DeleteMessage(name)
        : CatalogUiStrings.Positions.DeleteMessage(name);

    private void ApplySearch()
    {
        _searchQuery = SearchDraft;
        _currentPage = 1;
        ApplyPaging(resetPage: true);
    }

    private void ResetFilters()
    {
        _searchDraft = string.Empty;
        _searchQuery = string.Empty;
        OnPropertyChanged(nameof(SearchDraft));
        _currentPage = 1;
        ApplyPaging(resetPage: true);
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
        OnPropertyChanged(nameof(StatsTotal));
        OnPropertyChanged(nameof(StatsActive));
        OnPropertyChanged(nameof(StatsInactive));
    }

    private static string ExtractMessage(Exception ex) =>
        ex.Message.Trim('"', ' ');
}
