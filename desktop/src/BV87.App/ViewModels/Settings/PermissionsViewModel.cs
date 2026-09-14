using System.Collections.ObjectModel;
using System.Windows.Input;
using BV87.App;
using BV87.App.Helpers;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin;
using BV87.Core.Models.Admin.Catalog;
using BV87.Core.Session;

namespace BV87.App.ViewModels.Settings;

public sealed class PermissionsViewModel : ViewModelBase
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private readonly AdminApiClient _adminApi;

    private AccountStatsDto? _stats;
    private string _searchDraft = string.Empty;
    private string _searchQuery = string.Empty;
    private string _roleFilterDraft = string.Empty;
    private string _roleFilter = string.Empty;
    private string _statusFilterDraft = string.Empty;
    private string _statusFilter = string.Empty;
    private int _currentPage = 1;
    private int _pageSize = 20;
    private int _totalPages = 1;
    private long _totalItems;
    private bool _isLoading;
    private bool _hasListLoaded;
    private bool _isRefreshing;
    private string? _statusMessage;
    private string? _errorMessage;

    public PermissionsViewModel(AdminApiClient adminApi)
    {
        _adminApi = adminApi;
        PagedItems = new ObservableCollection<AccountRowViewModel>();

        RefreshCommand = new RelayCommand(async () => await LoadAsync(force: true));
        ApplyFiltersCommand = new RelayCommand(ApplyFilters);
        ResetFiltersCommand = new RelayCommand(ResetFilters);
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);
        AddCommand = new RelayCommand(() => FormRequested?.Invoke(this, null));
        EditCommand = new RelayCommand<AccountRowViewModel>(
            row => FormRequested?.Invoke(this, row),
            row => row != null);
        ResetPasswordCommand = new RelayCommand<AccountRowViewModel>(
            row =>
            {
                if (row != null)
                {
                    ResetPasswordRequested?.Invoke(this, row);
                }
            },
            row => row != null);
        DeleteCommand = new RelayCommand<AccountRowViewModel>(
            row =>
            {
                if (row != null)
                {
                    DeleteRequested?.Invoke(this, row);
                }
            },
            row => row != null);

        _ = LoadAsync(force: false);
    }

    public ObservableCollection<AccountRowViewModel> PagedItems { get; }

    public IReadOnlyList<AccountFilterOption> RoleFilterOptions { get; } =
    [
        new AccountFilterOption(string.Empty, SettingsUiStrings.Accounts.RoleAll),
        new AccountFilterOption("ADMIN", SettingsUiStrings.Accounts.RoleAdmin),
        new AccountFilterOption("HEAD", SettingsUiStrings.Accounts.RoleHead)
    ];

    public IReadOnlyList<AccountFilterOption> StatusFilterOptions { get; } =
    [
        new AccountFilterOption(string.Empty, SettingsUiStrings.Accounts.StatusAll),
        new AccountFilterOption("active", SettingsUiStrings.Accounts.Active),
        new AccountFilterOption("inactive", SettingsUiStrings.Accounts.Inactive)
    ];

    public ICommand RefreshCommand { get; }
    public ICommand ApplyFiltersCommand { get; }
    public ICommand ResetFiltersCommand { get; }
    public ICommand GoToPageCommand { get; }
    public ICommand AddCommand { get; }
    public ICommand EditCommand { get; }
    public ICommand ResetPasswordCommand { get; }
    public ICommand DeleteCommand { get; }

    public event EventHandler<AccountRowViewModel?>? FormRequested;
    public event EventHandler<AccountRowViewModel>? ResetPasswordRequested;
    public event EventHandler<AccountRowViewModel>? DeleteRequested;

    public string PageTitle => SettingsUiStrings.Accounts.PageTitle;
    public string PageSubtitle => SettingsUiStrings.Accounts.PageSubtitle;
    public string NewButtonLabel => SettingsUiStrings.Accounts.NewButton;
    public string SearchPlaceholder => SettingsUiStrings.Accounts.SearchPlaceholder;
    public string RoleFilterLabel => SettingsUiStrings.Accounts.RoleFilterLabel;
    public string StatusFilterLabel => SettingsUiStrings.Accounts.StatusFilterLabel;
    public string UnitLabel => SettingsUiStrings.Accounts.UnitLabel;
    public string StatsTotalLabel => SettingsUiStrings.Accounts.Stats.Total;
    public string StatsActiveLabel => SettingsUiStrings.Accounts.Stats.Active;
    public string StatsInactiveLabel => SettingsUiStrings.Accounts.Stats.Inactive;
    public string ColUsername => SettingsUiStrings.Accounts.ColUsername;
    public string ColEmpCode => SettingsUiStrings.Accounts.ColEmpCode;
    public string ColFullname => SettingsUiStrings.Accounts.ColFullname;
    public string ColRole => SettingsUiStrings.Accounts.ColRole;
    public string ColDept => SettingsUiStrings.Accounts.ColDept;
    public string ColStatus => SettingsUiStrings.Accounts.ColStatus;
    public string ColActions => SettingsUiStrings.Accounts.ColActions;

    public string StatsTotal => (_stats?.Total ?? _totalItems).ToString();
    public string StatsActive => (_stats?.Active ?? 0).ToString();
    public string StatsInactive => (_stats?.Inactive ?? 0).ToString();

    public string SearchDraft
    {
        get => _searchDraft;
        set => SetProperty(ref _searchDraft, value);
    }

    public string RoleFilterDraft
    {
        get => _roleFilterDraft;
        set => SetProperty(ref _roleFilterDraft, value ?? string.Empty);
    }

    public string StatusFilterDraft
    {
        get => _statusFilterDraft;
        set => SetProperty(ref _statusFilterDraft, value ?? string.Empty);
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
        set => SetProperty(ref _statusMessage, value);
    }

    public string? ErrorMessage
    {
        get => _errorMessage;
        set => SetProperty(ref _errorMessage, value);
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
                _ = LoadAsync(force: true);
            }
        }
    }

    public IReadOnlyList<int> PageSizeOptions { get; } = DefaultPageSizeOptions;

    public int TotalItems => (int)_totalItems;

    public int TotalPages => Math.Max(1, _totalPages);

    public bool ShowPagination => true;

    public long CurrentAccountId => App.Sessions.Session.User?.AccountId ?? 0;

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
            var statsTask = _adminApi.GetAccountStatsAsync();
            var listTask = _adminApi.ListAccountsPageAsync(
                string.IsNullOrWhiteSpace(_searchQuery) ? null : _searchQuery,
                string.IsNullOrWhiteSpace(_roleFilter) ? null : _roleFilter,
                string.IsNullOrWhiteSpace(_statusFilter) ? null : _statusFilter,
                _currentPage,
                _pageSize);

            await Task.WhenAll(statsTask, listTask);

            _stats = await statsTask;
            var page = await listTask;

            _totalItems = page.TotalItems;
            _totalPages = Math.Max(1, page.TotalPages);
            if (_currentPage > _totalPages)
            {
                _currentPage = _totalPages;
            }

            PagedItems.Clear();
            var rows = page.Items.Select(AccountRowViewModel.FromDto).ToList();
            PaginationRowNumberHelper.Apply(rows, _currentPage, _pageSize);
            foreach (var row in rows)
            {
                PagedItems.Add(row);
            }

            NotifyStatsChanged();
            OnPropertyChanged(nameof(CurrentPage));
            OnPropertyChanged(nameof(TotalItems));
            OnPropertyChanged(nameof(TotalPages));
            OnPropertyChanged(nameof(ShowPagination));
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
            PagedItems.Clear();
            _totalItems = 0;
            _totalPages = 1;
            OnPropertyChanged(nameof(TotalItems));
            OnPropertyChanged(nameof(TotalPages));
            OnPropertyChanged(nameof(ShowPagination));
        }
        finally
        {
            ListLoadBusy.End(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);
        }
    }

    public async Task<(List<AdminAccountDto> Accounts, List<AdminStaffDto> Staff)> LoadFormReferencesAsync()
    {
        var accountsTask = _adminApi.ListAccountsPageAsync(page: 1, pageSize: 500);
        var staffTask = _adminApi.ListStaffPageAsync(page: 1, pageSize: 500);
        await Task.WhenAll(accountsTask, staffTask);
        return ((await accountsTask).Items, (await staffTask).Items);
    }

    public async Task SaveAccountAsync(AccountUpsertRequest request, long? editId)
    {
        if (editId != null)
        {
            await _adminApi.UpdateAccountAsync(editId.Value, request);
            ShellToast.Success(ToastCopy.OkItem("cập nhật", ToastCopy.Account(request.Username)));
        }
        else
        {
            await _adminApi.CreateAccountAsync(request);
            ShellToast.Success(ToastCopy.OkItem("thêm", ToastCopy.Account(request.Username)));
        }

        await LoadAsync(force: true);
    }

    public async Task ResetPasswordAsync(long accountId, string newPassword, string confirmPassword, string username)
    {
        await _adminApi.ResetAccountPasswordAsync(accountId, new ResetPasswordRequest
        {
            NewPassword = newPassword,
            ConfirmPassword = confirmPassword
        });
        ShellToast.Success(ToastCopy.Ok("đặt lại", "mật khẩu", ToastCopy.Account(username)));
    }

    public async Task DeleteAccountAsync(AccountRowViewModel row)
    {
        if (row.Id == CurrentAccountId)
        {
            throw new InvalidOperationException(SettingsUiStrings.Accounts.CannotDeleteSelf);
        }

        await _adminApi.DeleteAccountAsync(row.Id);
        ShellToast.Success(ToastCopy.OkItem("xóa", ToastCopy.Account(row.Username)));
        await LoadAsync(force: true);
    }

    private void ApplyFilters()
    {
        _searchQuery = SearchDraft.Trim();
        _roleFilter = RoleFilterDraft ?? string.Empty;
        _statusFilter = StatusFilterDraft ?? string.Empty;
        _currentPage = 1;
        _ = LoadAsync(force: true);
    }

    private void ResetFilters()
    {
        SearchDraft = string.Empty;
        RoleFilterDraft = string.Empty;
        StatusFilterDraft = string.Empty;
        _searchQuery = string.Empty;
        _roleFilter = string.Empty;
        _statusFilter = string.Empty;
        _currentPage = 1;
        _ = LoadAsync(force: true);
    }

    private void ChangePage(int page)
    {
        _currentPage = Math.Clamp(page, 1, TotalPages);
        OnPropertyChanged(nameof(CurrentPage));
        _ = LoadAsync(force: true);
    }

    private void NotifyStatsChanged()
    {
        OnPropertyChanged(nameof(StatsTotal));
        OnPropertyChanged(nameof(StatsActive));
        OnPropertyChanged(nameof(StatsInactive));
    }

    private static string ExtractMessage(Exception ex) =>
        ex is ApiException api ? api.Message : SettingsUiStrings.Accounts.FlashDeleteFail;
}
