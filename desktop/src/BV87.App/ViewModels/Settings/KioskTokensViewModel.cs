using System.Collections.ObjectModel;
using System.Windows.Input;
using System.Windows.Threading;
using BV87.App.Helpers;
using BV87.App.ViewModels;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels.Settings;

public sealed class KioskTokensViewModel : ViewModelBase, IDisposable
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private readonly AdminApiClient _adminApi;
    private readonly DispatcherTimer _pollTimer;

    private List<KioskTokenRowViewModel> _allItems = [];
    private List<KioskTokenRowViewModel> _filteredItems = [];
    private int _currentPage = 1;
    private int _pageSize = 20;
    private bool _isLoading;
    private bool _hasListLoaded;
    private bool _isRefreshing;
    private string? _statusMessage;
    private string? _errorMessage;
    private int? _deptFilterDraft;
    private int? _appliedDeptFilter;
    private string? _statusFilterDraft = string.Empty;
    private string? _appliedStatusFilter;
    private string? _agentFilterDraft = string.Empty;
    private string? _appliedAgentFilter;

    public KioskTokensViewModel(AdminApiClient adminApi)
    {
        _adminApi = adminApi;
        PagedItems = new ObservableCollection<KioskTokenRowViewModel>();
        DeptFilterOptions = new ObservableCollection<DeptFilterOption>();

        _pollTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(60) };
        _pollTimer.Tick += (_, _) => _ = LoadAsync(force: true, silent: true);

        RefreshCommand = new RelayCommand(async () => await LoadAsync(force: true));
        ApplyFilterCommand = new RelayCommand(() => ListLoadBusy.RunRefreshing(v => IsRefreshing = v, ApplyFilters));
        ResetFiltersCommand = new RelayCommand(() => ListLoadBusy.RunRefreshing(v => IsRefreshing = v, ResetFilters));
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);
        IssueCommand = new RelayCommand(() => IssueRequested?.Invoke(this, EventArgs.Empty));
        CopyTokenCommand = new RelayCommand<KioskTokenRowViewModel>(CopyToken, row => row?.HasCopyableToken == true);

        _ = InitializeAsync();
    }

    public ObservableCollection<KioskTokenRowViewModel> PagedItems { get; }
    public ObservableCollection<DeptFilterOption> DeptFilterOptions { get; }

    public IReadOnlyList<KioskTokenFilterOption> StatusFilterOptions { get; } =
    [
        new(string.Empty, SettingsUiStrings.KioskTokens.FilterStatusAll),
        new("active", SettingsUiStrings.KioskTokens.FilterStatusActive),
        new("revoked", SettingsUiStrings.KioskTokens.FilterStatusRevoked)
    ];

    public IReadOnlyList<KioskTokenFilterOption> AgentFilterOptions { get; } =
    [
        new(string.Empty, SettingsUiStrings.KioskTokens.FilterAgentAll),
        new("online", SettingsUiStrings.KioskTokens.FilterAgentOnline),
        new("offline", SettingsUiStrings.KioskTokens.FilterAgentOffline)
    ];

    public ICommand RefreshCommand { get; }
    public ICommand ApplyFilterCommand { get; }
    public ICommand ResetFiltersCommand { get; }
    public ICommand GoToPageCommand { get; }
    public ICommand IssueCommand { get; }
    public ICommand CopyTokenCommand { get; }

    public event EventHandler? IssueRequested;
    public event EventHandler<KioskTokenRowViewModel>? RenameRequested;
    public event EventHandler<KioskTokenRowViewModel>? RotateRequested;
    public event EventHandler<KioskTokenRowViewModel>? RevokeRequested;

    public string PageTitle => SettingsUiStrings.KioskTokens.PageTitle;
    public string PageSubtitle => SettingsUiStrings.KioskTokens.PageSubtitle;
    public string IssueLabel => SettingsUiStrings.KioskTokens.Issue;
    public string UnitLabel => SettingsUiStrings.KioskTokens.UnitLabel;
    public string StatsTotalLabel => SettingsUiStrings.KioskTokens.Stats.Total;
    public string StatsActiveLabel => SettingsUiStrings.KioskTokens.Stats.Active;
    public string StatsRevokedLabel => SettingsUiStrings.KioskTokens.Stats.Revoked;
    public string StatsOnlineLabel => SettingsUiStrings.KioskTokens.Stats.Online;
    public string ColDept => SettingsUiStrings.KioskTokens.ColDept;
    public string ColLabel => SettingsUiStrings.KioskTokens.ColLabel;
    public string ColToken => SettingsUiStrings.KioskTokens.ColToken;
    public string ColAgent => SettingsUiStrings.KioskTokens.ColAgent;
    public string ColStatus => SettingsUiStrings.KioskTokens.ColStatus;
    public string ColCreated => SettingsUiStrings.KioskTokens.ColCreated;
    public string ColActions => SettingsUiStrings.KioskTokens.ColActions;
    public string ActionsMenu => SettingsUiStrings.KioskTokens.ActionsMenu;
    public string CopyLabel => SettingsUiStrings.Copy;
    public string FilterDeptLabel => SettingsUiStrings.KioskTokens.FilterDeptLabel;
    public string FilterStatusLabel => SettingsUiStrings.KioskTokens.FilterStatusLabel;
    public string FilterAgentLabel => SettingsUiStrings.KioskTokens.FilterAgentLabel;

    public string StatsTotal => _allItems.Count.ToString();
    public string StatsActive => _allItems.Count(x => x.Active).ToString();
    public string StatsRevoked => _allItems.Count(x => !x.Active).ToString();
    public string StatsOnline => _allItems.Count(x => x.Active && x.AgentOnline).ToString();

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

    public int? DeptFilterDraft
    {
        get => _deptFilterDraft;
        set => SetProperty(ref _deptFilterDraft, value);
    }

    public string? StatusFilterDraft
    {
        get => _statusFilterDraft;
        set => SetProperty(ref _statusFilterDraft, value);
    }

    public string? AgentFilterDraft
    {
        get => _agentFilterDraft;
        set => SetProperty(ref _agentFilterDraft, value);
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

    public int TotalItems => _filteredItems.Count;

    public int TotalPages => TotalItems == 0 ? 1 : (int)Math.Ceiling(TotalItems / (double)_pageSize);

    public bool ShowPagination => true;

    public void StartPolling() => _pollTimer.Start();

    public void StopPolling()
    {
        _pollTimer.Stop();
    }

    public void RequestRename(KioskTokenRowViewModel row) => RenameRequested?.Invoke(this, row);
    public void RequestRotate(KioskTokenRowViewModel row) => RotateRequested?.Invoke(this, row);
    public void RequestRevoke(KioskTokenRowViewModel row) => RevokeRequested?.Invoke(this, row);

    public async Task LoadAsync(bool force, bool silent = false)
    {
        if (_isLoading && !force)
        {
            return;
        }

        if (!silent)
        {
            ListLoadBusy.Begin(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);
        }

        if (!silent)
        {
            ErrorMessage = null;
        }

        try
        {
            var tokens = await _adminApi.ListKioskTokensAsync();
            _allItems = tokens
                .Select(t => KioskTokenRowViewModel.FromDto(t, AdminUtilitiesFormatHelper.FormatLogDateTimeOrDash))
                .OrderByDescending(t => t.Active)
                .ThenByDescending(t => t.Dto.CreatedAt)
                .ToList();
            RebuildFiltered();
            NotifyStatsChanged();
        }
        catch (Exception ex)
        {
            if (!silent)
            {
                ErrorMessage = ExtractMessage(ex);
            }

            _allItems = [];
            _filteredItems = [];
            PagedItems.Clear();
            NotifyStatsChanged();
            ApplyPaging();
        }
        finally
        {
            if (!silent)
            {
                ListLoadBusy.End(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);
            }
            else
            {
                IsLoading = false;
                IsRefreshing = false;
            }
        }
    }

    public async Task<List<DepartmentListItem>> LoadDepartmentsAsync() =>
        await _adminApi.ListDepartmentsAsync();

    public async Task<string> IssueTokenAsync(int deptCode, string? label)
    {
        var result = await _adminApi.CreateKioskTokenAsync(new KioskTokenCreateRequest
        {
            DeptCode = deptCode,
            Label = string.IsNullOrWhiteSpace(label) ? null : label.Trim()
        });
        ShellToast.Success(string.IsNullOrWhiteSpace(label)
            ? ToastCopy.OkItem("phát hành", "token kiosk")
            : ToastCopy.Ok("phát hành", "token", ToastCopy.Kiosk(label)));
        await LoadAsync(force: true);
        return result.Token ?? string.Empty;
    }

    public async Task RenameAsync(long id, string label)
    {
        await _adminApi.UpdateKioskTokenLabelAsync(id, new KioskTokenUpdateLabelRequest { Label = label });
        ShellToast.Success(ToastCopy.Ok("cập nhật", "nhãn", ToastCopy.Kiosk(label)));
        await LoadAsync(force: true);
    }

    public async Task<string> RotateAsync(long id)
    {
        var result = await _adminApi.RotateKioskTokenAsync(id);
        ShellToast.Success(ToastCopy.Ok("xoay", "token", KioskSubject(id)));
        await LoadAsync(force: true);
        return result.Token ?? string.Empty;
    }

    public async Task RevokeAsync(long id)
    {
        var subject = KioskSubject(id);
        await _adminApi.RevokeKioskTokenAsync(id);
        ShellToast.Success(ToastCopy.Ok("thu hồi", "token", subject));
        await LoadAsync(force: true);
    }

    public void Dispose() => _pollTimer.Stop();

    private async Task InitializeAsync()
    {
        await RefreshDeptFilterOptionsAsync();
        await LoadAsync(force: false);
    }

    private async Task RefreshDeptFilterOptionsAsync()
    {
        try
        {
            var departments = await _adminApi.ListDepartmentsAsync();
            DeptFilterOptions.Clear();
            DeptFilterOptions.Add(new DeptFilterOption(null, AdminUiStrings.DeptFilterAll));
            foreach (var dept in departments.OrderBy(d => d.DeptCode))
            {
                DeptFilterOptions.Add(new DeptFilterOption(dept.DeptCode, dept.DisplayLabel));
            }
        }
        catch
        {
            if (DeptFilterOptions.Count == 0)
            {
                DeptFilterOptions.Add(new DeptFilterOption(null, AdminUiStrings.DeptFilterAll));
            }
        }
    }

    private void ApplyFilters()
    {
        _appliedDeptFilter = DeptFilterDraft;
        _appliedStatusFilter = string.IsNullOrEmpty(StatusFilterDraft) ? null : StatusFilterDraft;
        _appliedAgentFilter = string.IsNullOrEmpty(AgentFilterDraft) ? null : AgentFilterDraft;
        _currentPage = 1;
        RebuildFiltered();
    }

    private void ResetFilters()
    {
        DeptFilterDraft = null;
        StatusFilterDraft = string.Empty;
        AgentFilterDraft = string.Empty;
        _appliedDeptFilter = null;
        _appliedStatusFilter = null;
        _appliedAgentFilter = null;
        _currentPage = 1;
        RebuildFiltered();
    }

    private void RebuildFiltered()
    {
        IEnumerable<KioskTokenRowViewModel> query = _allItems;
        if (_appliedDeptFilter != null)
        {
            query = query.Where(x => x.Dto.DeptCode == _appliedDeptFilter);
        }

        if (_appliedStatusFilter == "active")
        {
            query = query.Where(x => x.Active);
        }
        else if (_appliedStatusFilter == "revoked")
        {
            query = query.Where(x => !x.Active);
        }

        if (_appliedAgentFilter == "online")
        {
            query = query.Where(x => x.AgentOnline);
        }
        else if (_appliedAgentFilter == "offline")
        {
            query = query.Where(x => x.Active && !x.AgentOnline);
        }

        _filteredItems = query.ToList();
        ApplyPaging();
    }

    private void ChangePage(int page)
    {
        _currentPage = Math.Clamp(page, 1, TotalPages);
        ApplyPaging();
        OnPropertyChanged(nameof(CurrentPage));
    }

    private void ApplyPaging()
    {
        PagedItems.Clear();
        if (_filteredItems.Count == 0)
        {
            OnPropertyChanged(nameof(TotalItems));
            OnPropertyChanged(nameof(TotalPages));
            OnPropertyChanged(nameof(ShowPagination));
            OnPropertyChanged(nameof(CurrentPage));
            return;
        }

        if (_currentPage > TotalPages)
        {
            _currentPage = TotalPages;
        }

        var start = (_currentPage - 1) * _pageSize;
        var pageRows = _filteredItems.Skip(start).Take(_pageSize).ToList();
        PaginationRowNumberHelper.Apply(pageRows, _currentPage, _pageSize);
        PagedItems.Clear();
        foreach (var item in pageRows)
        {
            PagedItems.Add(item);
        }

        OnPropertyChanged(nameof(CurrentPage));
        OnPropertyChanged(nameof(TotalItems));
        OnPropertyChanged(nameof(TotalPages));
        OnPropertyChanged(nameof(ShowPagination));
    }

    private string KioskSubject(long id)
    {
        var row = _allItems.FirstOrDefault(x => x.Id == id);
        return ToastCopy.Kiosk(row?.Dto.Label);
    }

    private void CopyToken(KioskTokenRowViewModel? row)
    {
        if (row?.Dto.Token == null)
        {
            return;
        }

        System.Windows.Clipboard.SetText(row.Dto.Token);
        ErrorMessage = null;
        ShellToast.Success(ToastCopy.OkItem("sao chép", "token"));
    }

    private void NotifyStatsChanged()
    {
        OnPropertyChanged(nameof(StatsTotal));
        OnPropertyChanged(nameof(StatsActive));
        OnPropertyChanged(nameof(StatsRevoked));
        OnPropertyChanged(nameof(StatsOnline));
    }

    private static string ExtractMessage(Exception ex) =>
        ex is ApiException api ? api.Message : SettingsUiStrings.KioskTokens.LoadError;
}
