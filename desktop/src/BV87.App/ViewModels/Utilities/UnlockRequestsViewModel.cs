using System.Collections.ObjectModel;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.App.ViewModels;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels.Utilities;

public sealed class UnlockRequestsViewModel : ViewModelBase
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private readonly AdminApiClient _adminApi;

    private List<UnlockRequestRowViewModel> _allItems = [];
    private string _statusDraft = "PENDING";
    private string _appliedStatus = "PENDING";
    private int _currentPage = 1;
    private int _pageSize = 20;
    private bool _isLoading;
    private bool _hasListLoaded;
    private bool _isRefreshing;
    private string? _statusMessage;
    private string? _errorMessage;

    public UnlockRequestsViewModel(AdminApiClient adminApi)
    {
        _adminApi = adminApi;
        PagedItems = new ObservableCollection<UnlockRequestRowViewModel>();
        StatusFilterOptions =
        [
            new UnlockStatusFilterOption("PENDING", UtilitiesUiStrings.UnlockRequests.StatusPending),
            new UnlockStatusFilterOption("APPROVED", UtilitiesUiStrings.UnlockRequests.StatusApproved),
            new UnlockStatusFilterOption("REJECTED", UtilitiesUiStrings.UnlockRequests.StatusRejected)
        ];

        RefreshCommand = new RelayCommand(async () => await LoadAsync(force: true));
        ApplyFilterCommand = new RelayCommand(ApplyFilter);
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);
        ApproveCommand = new RelayCommand<UnlockRequestRowViewModel>(
            row => _ = ApproveAsync(row),
            row => row is { IsPending: true } && !IsLoading);
        RejectCommand = new RelayCommand<UnlockRequestRowViewModel>(
            row =>
            {
                if (row != null)
                {
                    RejectRequested?.Invoke(this, row);
                }
            },
            row => row is { IsPending: true } && !IsLoading);

        _ = LoadAsync(force: false);
    }

    public ObservableCollection<UnlockRequestRowViewModel> PagedItems { get; }
    public IReadOnlyList<UnlockStatusFilterOption> StatusFilterOptions { get; }

    public ICommand RefreshCommand { get; }
    public ICommand ApplyFilterCommand { get; }
    public ICommand GoToPageCommand { get; }
    public ICommand ApproveCommand { get; }
    public ICommand RejectCommand { get; }

    public event EventHandler<UnlockRequestRowViewModel>? RejectRequested;

    public string PageTitle => UtilitiesUiStrings.UnlockRequests.PageTitle;
    public string PageSubtitle => UtilitiesUiStrings.UnlockRequests.PageSubtitle;
    public string ListTitle => UtilitiesUiStrings.UnlockRequests.ListTitle;
    public string FilterStatusLabel => UtilitiesUiStrings.UnlockRequests.FilterStatus;
    public string EmptyMessage => UtilitiesUiStrings.UnlockRequests.Empty;
    public string LoadingMessage => UtilitiesUiStrings.Loading;
    public string UnitLabel => UtilitiesUiStrings.UnlockRequests.UnitLabel;

    public string SelectedStatus
    {
        get => _statusDraft;
        set => SetProperty(ref _statusDraft, value);
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

    public int TotalItems => _allItems.Count;

    public int TotalPages => TotalItems == 0
        ? 1
        : (int)Math.Ceiling(TotalItems / (double)_pageSize);

    public bool ShowPagination => true;

    public async Task RejectAsync(UnlockRequestRowViewModel row, string? note)
    {
        ErrorMessage = null;
        StatusMessage = null;

        try
        {
            await _adminApi.RejectUnlockRequestAsync(row.Id, note);
            ShellToast.Success(ToastCopy.Ok("từ chối", "yêu cầu mở khóa", ToastCopy.Dept(row.DeptLabel)));
            await LoadAsync(force: true);
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.Fail("từ chối", "yêu cầu mở khóa", ToastCopy.Dept(row.DeptLabel)));
        }
    }

    private async Task ApproveAsync(UnlockRequestRowViewModel? row)
    {
        if (row == null)
        {
            return;
        }

        ErrorMessage = null;
        StatusMessage = null;

        try
        {
            await _adminApi.ApproveUnlockRequestAsync(row.Id);
            ShellToast.Success(ToastCopy.Ok("duyệt", "yêu cầu mở khóa", ToastCopy.Dept(row.DeptLabel)));
            await LoadAsync(force: true);
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.Fail("duyệt", "yêu cầu mở khóa", ToastCopy.Dept(row.DeptLabel)));
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
            var data = await _adminApi.ListUnlockRequestsAsync(_appliedStatus);
            _allItems = data.Select(item => new UnlockRequestRowViewModel(item)).ToList();
            ApplyPaging(resetPage: force);
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
            _allItems = [];
            ApplyPaging(resetPage: true);
        }
        finally
        {
            ListLoadBusy.End(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);
        }
    }

    private void ApplyFilter()
    {
        _appliedStatus = _statusDraft;
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
        var pageRows = _allItems.Skip(startIndex).Take(_pageSize).ToList();
        PaginationRowNumberHelper.Apply(pageRows, _currentPage, _pageSize);
        foreach (var item in pageRows)
        {
            PagedItems.Add(item);
        }

        OnPropertyChanged(nameof(CurrentPage));
        OnPropertyChanged(nameof(TotalItems));
        OnPropertyChanged(nameof(TotalPages));
        OnPropertyChanged(nameof(ShowPagination));
    }

    private static string ExtractMessage(Exception ex) =>
        ex is ApiException apiEx && !string.IsNullOrWhiteSpace(apiEx.Message)
            ? apiEx.Message
            : ex.Message;
}
