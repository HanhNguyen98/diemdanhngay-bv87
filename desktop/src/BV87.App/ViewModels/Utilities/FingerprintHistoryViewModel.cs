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

public sealed class FingerprintHistoryViewModel : ViewModelBase
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private readonly AdminApiClient _adminApi;

    private DateOnly _appliedFrom;
    private DateOnly _appliedTo;
    private int? _appliedDeptFilter;
    private int? _deptFilterDraft;
    private DateTime? _dateFromDraft;
    private DateTime? _dateToDraft;
    private int _currentPage = 1;
    private int _pageSize = 20;
    private long _totalItems;
    private int _totalPages = 1;
    private bool _isLoading;
    private bool _hasListLoaded;
    private bool _isRefreshing;
    private string? _errorMessage;

    public FingerprintHistoryViewModel(AdminApiClient adminApi)
    {
        _adminApi = adminApi;
        var range = AdminUtilitiesFormatHelper.DefaultHistoryRange();
        _appliedFrom = range.From;
        _appliedTo = range.To;
        _dateFromDraft = AdminUtilitiesFormatHelper.ToDateTime(range.From);
        _dateToDraft = AdminUtilitiesFormatHelper.ToDateTime(range.To);

        Items = new ObservableCollection<FingerprintTemplateAuditLogRowViewModel>();
        DeptFilterOptions = new ObservableCollection<DeptFilterOption>();

        RefreshCommand = new RelayCommand(async () => await LoadAsync(force: true));
        ApplyFilterCommand = new RelayCommand(ApplyFilter);
        ResetFiltersCommand = new RelayCommand(ResetFilters);
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);

        _ = InitializeAsync();
    }

    public ObservableCollection<FingerprintTemplateAuditLogRowViewModel> Items { get; }
    public ObservableCollection<DeptFilterOption> DeptFilterOptions { get; }

    public ICommand RefreshCommand { get; }
    public ICommand ApplyFilterCommand { get; }
    public ICommand ResetFiltersCommand { get; }
    public ICommand GoToPageCommand { get; }

    public string PageTitle => UtilitiesUiStrings.FingerprintHistory.PageTitle;
    public string PageSubtitle => UtilitiesUiStrings.FingerprintHistory.PageSubtitle;
    public string FilterRangeLabel => UtilitiesUiStrings.FingerprintHistory.FilterRange;
    public string EmptyMessage => UtilitiesUiStrings.FingerprintHistory.Empty;
    public string LoadingMessage => UtilitiesUiStrings.Loading;
    public string UnitLabel => UtilitiesUiStrings.FingerprintHistory.UnitLabel;

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

    public string? ErrorMessage
    {
        get => _errorMessage;
        private set => SetProperty(ref _errorMessage, value);
    }

    public DateTime? DateFromDraft
    {
        get => _dateFromDraft;
        set => SetProperty(ref _dateFromDraft, value);
    }

    public DateTime? DateToDraft
    {
        get => _dateToDraft;
        set => SetProperty(ref _dateToDraft, value);
    }

        public int? SelectedDeptFilter
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
                _ = LoadAsync(force: true);
            }
        }
    }

    public IReadOnlyList<int> PageSizeOptions { get; } = DefaultPageSizeOptions;

    public long TotalItems => _totalItems;

    public int TotalPages => Math.Max(1, _totalPages);

    public bool ShowPagination => true;

    private async Task InitializeAsync()
    {
        await LoadDepartmentsAsync();
        await LoadAsync(force: false);
    }

    private async Task LoadDepartmentsAsync()
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

        ListLoadBusy.Begin(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);

        ErrorMessage = null;

        try
        {
            var data = await _adminApi.GetFingerprintTemplateAuditLogsAsync(
                _appliedFrom,
                _appliedTo,
                _appliedDeptFilter,
                _currentPage,
                _pageSize);

            Items.Clear();
            var rows = (data.Items ?? []).Select(item => new FingerprintTemplateAuditLogRowViewModel(item)).ToList();
            PaginationRowNumberHelper.Apply(rows, _currentPage, _pageSize);
            foreach (var row in rows)
            {
                Items.Add(row);
            }

            _currentPage = data.Page > 0 ? data.Page : _currentPage;
            _totalItems = data.TotalItems;
            _totalPages = Math.Max(data.TotalPages, 1);

            OnPropertyChanged(nameof(CurrentPage));
            OnPropertyChanged(nameof(TotalItems));
            OnPropertyChanged(nameof(TotalPages));
            OnPropertyChanged(nameof(ShowPagination));
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
            Items.Clear();
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

    private void ApplyFilter()
    {
        var from = AdminUtilitiesFormatHelper.ToDateOnly(DateFromDraft);
        var to = AdminUtilitiesFormatHelper.ToDateOnly(DateToDraft);

        if (from == null || to == null)
        {
            return;
        }

        if (from > to)
        {
            ErrorMessage = UtilitiesUiStrings.DateRangeInvalid;
            return;
        }

        ErrorMessage = null;
        _appliedFrom = from.Value;
        _appliedTo = to.Value;
        _appliedDeptFilter = _deptFilterDraft;
        _currentPage = 1;
        _ = LoadAsync(force: true);
    }

    private void ResetFilters()
    {
        var range = AdminUtilitiesFormatHelper.DefaultHistoryRange();
        ErrorMessage = null;
        _appliedFrom = range.From;
        _appliedTo = range.To;
        _appliedDeptFilter = null;
        _deptFilterDraft = null;
        _dateFromDraft = AdminUtilitiesFormatHelper.ToDateTime(range.From);
        _dateToDraft = AdminUtilitiesFormatHelper.ToDateTime(range.To);
        OnPropertyChanged(nameof(DateFromDraft));
        OnPropertyChanged(nameof(DateToDraft));
        OnPropertyChanged(nameof(SelectedDeptFilter));
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
        _ = LoadAsync(force: true);
    }

    private static string ExtractMessage(Exception ex) =>
        ex is ApiException apiEx && !string.IsNullOrWhiteSpace(apiEx.Message)
            ? apiEx.Message
            : ex.Message;
}
