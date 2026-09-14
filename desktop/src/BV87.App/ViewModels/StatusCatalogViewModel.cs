using System.Collections.ObjectModel;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Excel;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.ViewModels;

public sealed class StatusCatalogViewModel : ViewModelBase
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private readonly AdminApiClient _adminApi;
    private readonly ExcelFileService _excelFileService = new();

    private List<StatusCatalogRowViewModel> _allItems = [];
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

    public StatusCatalogViewModel(AdminApiClient adminApi)
    {
        _adminApi = adminApi;
        PagedItems = new ObservableCollection<StatusCatalogRowViewModel>();

        RefreshCommand = new RelayCommand(async () => await LoadAsync(force: true));
        ApplySearchCommand = new RelayCommand(() => ListLoadBusy.RunRefreshing(v => IsRefreshing = v, ApplySearch));
        ResetFiltersCommand = new RelayCommand(() => ListLoadBusy.RunRefreshing(v => IsRefreshing = v, ResetFilters));
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);
        AddCommand = new RelayCommand(() => FormRequested?.Invoke(this, null));
        EditCommand = new RelayCommand<StatusCatalogRowViewModel>(
            row => FormRequested?.Invoke(this, row),
            row => row != null);
        DeleteCommand = new RelayCommand<StatusCatalogRowViewModel>(
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

    public ObservableCollection<StatusCatalogRowViewModel> PagedItems { get; }

    public ICommand RefreshCommand { get; }
    public ICommand ApplySearchCommand { get; }
    public ICommand ResetFiltersCommand { get; }
    public ICommand GoToPageCommand { get; }
    public ICommand AddCommand { get; }
    public ICommand EditCommand { get; }
    public ICommand DeleteCommand { get; }

    public event EventHandler<StatusCatalogRowViewModel?>? FormRequested;
    public event EventHandler<StatusCatalogRowViewModel>? DeleteRequested;

    public string PageTitle => CatalogUiStrings.StatusCatalog.PageTitle;
    public string NewButtonLabel => CatalogUiStrings.StatusCatalog.NewButton;
    public string SearchPlaceholder => CatalogUiStrings.StatusCatalog.SearchPlaceholder;
    public string UnitLabel => CatalogUiStrings.StatusCatalog.UnitLabel;
    public string StatsTotalLabel => CatalogUiStrings.StatusCatalog.StatsTotal;
    public string StatsActiveLabel => CatalogUiStrings.StatusCatalog.StatsActive;
    public string StatsInactiveLabel => CatalogUiStrings.StatusCatalog.StatsInactive;
    public string ColCode => CatalogUiStrings.StatusCatalog.ColCode;
    public string ColLabel => CatalogUiStrings.StatusCatalog.ColLabel;
    public string ColBadge => CatalogUiStrings.StatusCatalog.ColBadge;
    public string ColSort => CatalogUiStrings.StatusCatalog.ColSort;
    public string ColUsage => CatalogUiStrings.StatusCatalog.ColUsage;
    public string ColStatus => CatalogUiStrings.StatusCatalog.ColStatus;

    public int StatsTotal => _allItems.Count;
    public int StatsActive => _allItems.Count(i => i.Active);
    public int StatsInactive => _allItems.Count(i => !i.Active);

    public IReadOnlyList<StatusCatalogRowViewModel> AllItems => _allItems;

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

    public ExcelRegistryConfig ExcelConfig => StatusCatalogExcelRegistry.Config;

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

    public IReadOnlyList<StatusCatalogParentOption> GetParentComboOptions(string? excludeCode)
    {
        var options = new List<StatusCatalogParentOption> { StatusCatalogParentOption.Placeholder };
        options.AddRange(
            _allItems
                .Where(i => i.GroupParent && !string.Equals(i.Code, excludeCode, StringComparison.OrdinalIgnoreCase))
                .OrderBy(i => i.SortOrder)
                .ThenBy(i => i.Code)
                .Select(i => StatusCatalogParentOption.FromStatus(i.Code, i.Label)));
        return options;
    }

    private List<StatusCatalogRowViewModel> FilteredItems
    {
        get
        {
            if (string.IsNullOrWhiteSpace(_searchQuery))
            {
                return _allItems;
            }

            var query = _searchQuery.Trim().ToLowerInvariant();
            return _allItems.Where(item =>
                    item.Code.ToLowerInvariant().Contains(query)
                    || item.Label.ToLowerInvariant().Contains(query)
                    || item.BadgeLabel.ToLowerInvariant().Contains(query))
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
            _allItems = (await _adminApi.ListAttendanceStatusTypesAsync())
                .Select(StatusCatalogRowViewModel.FromDto)
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

    public async Task SaveItemAsync(AttendanceStatusTypeUpsertRequest request, long? editId)
    {
        ErrorMessage = null;

        try
        {
            if (editId != null)
            {
                await _adminApi.UpdateAttendanceStatusTypeAsync(editId.Value, request);
                ShellToast.Success(ToastCopy.OkItem("cập nhật", $"trạng thái {request.Label}"));
            }
            else
            {
                await _adminApi.CreateAttendanceStatusTypeAsync(request);
                ShellToast.Success(ToastCopy.OkItem("thêm", $"trạng thái {request.Label}"));
            }

            await LoadAsync(force: true);
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
            throw;
        }
    }

    public async Task DeleteItemAsync(StatusCatalogRowViewModel row)
    {
        ErrorMessage = null;

        try
        {
            await _adminApi.DeleteAttendanceStatusTypeAsync(row.Id);
            ShellToast.Success(ToastCopy.OkItem("xóa", $"trạng thái {row.Label}"));
            await LoadAsync(force: true);
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.FailItem("xóa", $"trạng thái {row.Label}"));
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
                StatusCatalogExcelImportMapper.MapRows,
                payload => _adminApi.CreateAttendanceStatusTypeAsync(new AttendanceStatusTypeUpsertRequest
                {
                    Code = payload.Code,
                    Label = payload.Label,
                    BadgeLabel = payload.BadgeLabel,
                    ColorKey = payload.ColorKey,
                    IconKey = payload.IconKey,
                    SortOrder = payload.SortOrder,
                    Active = payload.Active,
                    ManualAllowed = payload.ManualAllowed,
                    GroupParent = payload.GroupParent,
                    ParentCode = payload.ParentCode
                }),
                CatalogUiStrings.StatusCatalog.UnitLabel);

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

    private IReadOnlyList<object> BuildExportRow(StatusCatalogRowViewModel item) =>
    [
        item.Code,
        item.Label,
        item.BadgeLabel,
        item.SortOrder,
        item.UsageCount,
        item.Active ? CatalogUiStrings.Active : CatalogUiStrings.Inactive
    ];

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
