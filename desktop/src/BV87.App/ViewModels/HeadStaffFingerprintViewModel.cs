using System.Collections.ObjectModel;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.App.ViewModels.Utilities;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels;

public sealed class HeadStaffFingerprintRowViewModel : ViewModelBase, IPageRowNumber
{
    private string? _avatarUrl;

    public HeadStaffFingerprintRowViewModel(FingerprintStatusDto dto)
    {
        EmpCode = dto.EmpCode;
        EmpCodeFormatted = dto.EmpCodeFormatted ?? dto.EmpCode.ToString("D5");
        Fullname = dto.Fullname ?? string.Empty;
        Registered = dto.Registered;
        RawFingerLabel = dto.FingerLabel;
        FingerLabel = dto.Registered
            ? CatalogUiStrings.Staff.FingerprintLabel(dto.FingerLabel)
            : CatalogUiStrings.Staff.FingerprintMissing;
    }

    public int RowNumber { get; set; }

    public int EmpCode { get; }
    public string EmpCodeFormatted { get; }
    public string Fullname { get; }
    public string Initials => StaffInitialsHelper.FromFullname(Fullname);
    public bool Registered { get; }
    public string? AvatarUrl
    {
        get => _avatarUrl;
        set => SetProperty(ref _avatarUrl, value);
    }
    public string FingerLabel { get; }
    public string? RawFingerLabel { get; }
}

public sealed class HeadStaffFingerprintViewModel : ViewModelBase
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private readonly HeadApiClient _headApi;

    private List<HeadStaffFingerprintRowViewModel> _allItems = [];
    private string _searchDraft = string.Empty;
    private string _appliedSearch = string.Empty;
    private FingerprintStaffFilter _appliedFingerprintFilter = FingerprintStaffFilter.All;
    private FingerprintStaffFilter _fingerprintFilterDraft = FingerprintStaffFilter.All;
    private int _currentPage = 1;
    private int _pageSize = 20;
    private int _totalItems;
    private bool _isLoading;
    private bool _hasListLoaded;
    private bool _isRefreshing;
    private string? _statusMessage;
    private string? _errorMessage;
    private int _statsTotal;
    private int _statsRegistered;
    private int _statsMissing;

    public HeadStaffFingerprintViewModel(HeadApiClient headApi)
    {
        _headApi = headApi;
        PagedItems = new ObservableCollection<HeadStaffFingerprintRowViewModel>();
        FingerprintFilterOptions =
        [
            new FingerprintStatusFilterOption(FingerprintStaffFilter.All, HeadUiStrings.Staff.FilterAll),
            new FingerprintStatusFilterOption(FingerprintStaffFilter.Registered, HeadUiStrings.Staff.FilterRegistered),
            new FingerprintStatusFilterOption(FingerprintStaffFilter.Missing, HeadUiStrings.Staff.FilterMissing)
        ];

        RefreshCommand = new RelayCommand(async () => await LoadAsync(force: true));
        ApplyFilterCommand = new RelayCommand(() => ListLoadBusy.RunRefreshing(v => IsRefreshing = v, ApplyFilters));
        ResetFiltersCommand = new RelayCommand(() => ListLoadBusy.RunRefreshing(v => IsRefreshing = v, ResetFilters));
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);
        DeleteFingerprintCommand = new RelayCommand<HeadStaffFingerprintRowViewModel>(
            row =>
            {
                if (row != null)
                {
                    DeleteFingerprintRequested?.Invoke(this, row);
                }
            },
            row => row is { Registered: true } && !IsLoading);
        EditAvatarCommand = new RelayCommand<HeadStaffFingerprintRowViewModel>(
            row =>
            {
                if (row != null)
                {
                    EditAvatarRequested?.Invoke(this, row);
                }
            },
            row => row != null && !IsLoading);

        _ = LoadAsync(force: false);
    }

    public ObservableCollection<HeadStaffFingerprintRowViewModel> PagedItems { get; }
    public IReadOnlyList<FingerprintStatusFilterOption> FingerprintFilterOptions { get; }

    public ICommand RefreshCommand { get; }
    public ICommand ApplyFilterCommand { get; }
    public ICommand ResetFiltersCommand { get; }
    public ICommand GoToPageCommand { get; }
    public ICommand DeleteFingerprintCommand { get; }
    public ICommand EditAvatarCommand { get; }

    public event EventHandler<HeadStaffFingerprintRowViewModel>? DeleteFingerprintRequested;
    public event EventHandler<HeadStaffFingerprintRowViewModel>? EditAvatarRequested;

    public string PageTitle => HeadUiStrings.Staff.PageTitle;
    public string ListTitle => HeadUiStrings.Staff.ListTitle;
    public string LoadingMessage => HeadUiStrings.Staff.Loading;
    public string StatsTotalText => _statsTotal.ToString("N0");
    public string StatsRegisteredText => _statsRegistered.ToString("N0");
    public string StatsMissingText => _statsMissing.ToString("N0");

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

    public string SearchDraft
    {
        get => _searchDraft;
        set => SetProperty(ref _searchDraft, value);
    }

    public FingerprintStaffFilter SelectedFingerprintFilter
    {
        get => _fingerprintFilterDraft;
        set => SetProperty(ref _fingerprintFilterDraft, value);
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

    public int TotalItems => _totalItems;

    public int TotalPages => TotalItems == 0
        ? 1
        : (int)Math.Ceiling(TotalItems / (double)_pageSize);

    public bool ShowPagination => true;

    public async Task DeleteFingerprintAsync(HeadStaffFingerprintRowViewModel row)
    {
        ErrorMessage = null;
        StatusMessage = null;

        try
        {
            await _headApi.DeleteFingerprintAsync(row.EmpCode);
            ShellToast.Success(ToastCopy.Ok("xóa", "vân tay", ToastCopy.Staff(row.Fullname)));
            await LoadAsync(force: true);
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.Fail("xóa", "vân tay", ToastCopy.Staff(row.Fullname)));
        }
    }

    public async Task UpdateAvatarAsync(HeadStaffFingerprintRowViewModel row, string? avatarUrl)
    {
        ErrorMessage = null;
        StatusMessage = null;

        try
        {
            var updated = await _headApi.UpdateStaffAvatarAsync(row.EmpCode, avatarUrl);
            row.AvatarUrl = updated.AvatarUrl;
            ShellToast.Success(ToastCopy.Ok("cập nhật", "ảnh đại diện", ToastCopy.Staff(row.Fullname)));
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.Fail("cập nhật", "ảnh đại diện", ToastCopy.Staff(row.Fullname)));
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
            var fingerprintsTask = _headApi.ListFingerprintsAsync();
            var staffTask = _headApi.ListStaffAsync();
            await Task.WhenAll(fingerprintsTask, staffTask);

            var avatars = (await staffTask)
                .Where(s => s.EmpCode > 0)
                .GroupBy(s => s.EmpCode)
                .ToDictionary(g => g.Key, g => g.First().AvatarUrl);

            _allItems = (await fingerprintsTask)
                .OrderBy(x => x.EmpCode)
                .Select(x =>
                {
                    var row = new HeadStaffFingerprintRowViewModel(x);
                    if (avatars.TryGetValue(x.EmpCode, out var url))
                    {
                        row.AvatarUrl = url;
                    }

                    return row;
                })
                .ToList();

            UpdateStats();
            _currentPage = 1;
            ApplyPaging();
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
            _allItems = [];
            UpdateStats();
            PagedItems.Clear();
            _totalItems = 0;
            OnPropertyChanged(nameof(TotalItems));
            OnPropertyChanged(nameof(TotalPages));
            OnPropertyChanged(nameof(ShowPagination));
        }
        finally
        {
            ListLoadBusy.End(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);
            CommandManager.InvalidateRequerySuggested();
        }
    }

    private void UpdateStats()
    {
        _statsTotal = _allItems.Count;
        _statsRegistered = _allItems.Count(x => x.Registered);
        _statsMissing = _statsTotal - _statsRegistered;

        OnPropertyChanged(nameof(StatsTotalText));
        OnPropertyChanged(nameof(StatsRegisteredText));
        OnPropertyChanged(nameof(StatsMissingText));
    }

    private void ApplyFilters()
    {
        _appliedSearch = SearchDraft.Trim();
        _appliedFingerprintFilter = SelectedFingerprintFilter;
        _currentPage = 1;
        ApplyPaging();
    }

    private void ResetFilters()
    {
        SearchDraft = string.Empty;
        SelectedFingerprintFilter = FingerprintStaffFilter.All;
        ApplyFilters();
    }

    private void ApplyPaging()
    {
        IEnumerable<HeadStaffFingerprintRowViewModel> filtered = _allItems;

        if (!string.IsNullOrWhiteSpace(_appliedSearch))
        {
            var q = _appliedSearch.ToLowerInvariant();
            filtered = filtered.Where(s =>
                s.Fullname.ToLowerInvariant().Contains(q)
                || s.EmpCode.ToString().Contains(q)
                || s.EmpCodeFormatted.Contains(q, StringComparison.OrdinalIgnoreCase));
        }

        filtered = _appliedFingerprintFilter switch
        {
            FingerprintStaffFilter.Registered => filtered.Where(s => s.Registered),
            FingerprintStaffFilter.Missing => filtered.Where(s => !s.Registered),
            _ => filtered
        };

        var list = filtered.ToList();
        _totalItems = list.Count;

        if (_currentPage > TotalPages)
        {
            _currentPage = TotalPages;
        }

        PagedItems.Clear();
        var startIndex = (_currentPage - 1) * _pageSize;
        var pageRows = list.Skip(startIndex).Take(_pageSize).ToList();
        PaginationRowNumberHelper.Apply(pageRows, _currentPage, _pageSize);
        foreach (var row in pageRows)
        {
            PagedItems.Add(row);
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
        ApplyPaging();
    }

    private static string ExtractMessage(Exception ex) =>
        ex is ApiException apiEx && !string.IsNullOrWhiteSpace(apiEx.Message)
            ? apiEx.Message
            : ex.Message;
}
