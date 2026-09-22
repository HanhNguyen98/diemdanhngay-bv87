using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;
using BV87.App.Hardware;
using BV87.App.Helpers;
using BV87.App.Services;
using BV87.App.ViewModels;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels.Utilities;

public enum FingerprintStaffFilter
{
    All,
    Missing,
    Registered
}

public sealed class FingerprintEnrollStaffRow
{
    public FingerprintEnrollStaffRow(FingerprintStatusDto dto, int rowNumber)
    {
        RowNumber = rowNumber;
        EmpCode = dto.EmpCode;
        EmpCodeFormatted = dto.EmpCodeFormatted ?? dto.EmpCode.ToString("D5");
        Fullname = dto.Fullname ?? string.Empty;
        Registered = dto.Registered;
        FingerLabel = dto.FingerLabel;
        Display = $"{EmpCodeFormatted} — {Fullname}";
    }

    public int RowNumber { get; }
    public int EmpCode { get; }
    public string EmpCodeFormatted { get; }
    public string Fullname { get; }
    public bool Registered { get; }
    public string? FingerLabel { get; }
    public string Display { get; }

    public string RegistrationStatusLabel => Registered
        ? UtilitiesUiStrings.FingerprintEnroll.FilterRegistered
        : UtilitiesUiStrings.FingerprintEnroll.FilterMissing;

    public string RegistrationDisplay =>
        Registered && !string.IsNullOrWhiteSpace(FingerLabel)
            ? $"{RegistrationStatusLabel} ({FingerLabel})"
            : RegistrationStatusLabel;

    public string RegistrationDetail =>
        Registered && !string.IsNullOrWhiteSpace(FingerLabel) ? FingerLabel! : RegistrationStatusLabel;
}

public sealed class FingerprintStatusFilterOption(FingerprintStaffFilter filter, string label)
{
    public FingerprintStaffFilter Filter { get; } = filter;

    public string Label { get; } = label;
}

public sealed class FingerprintEnrollViewModel : ViewModelBase, IDisposable
{
    private static readonly int[] DefaultPageSizeOptions = [10, 20, 50, 100];

    private const int AutoConnectMaxAttempts = 5;
    private const int AutoConnectFirstDelayMs = 400;
    private const int AutoConnectRetryDelayMs = 800;
    private const int DeviceWatchIntervalMs = 2500;

    private readonly AppMode _mode;
    private readonly AdminApiClient? _adminApi;
    private readonly HeadApiClient? _headApi;
    private readonly string _pageTitle;
    private readonly ZkFingerprintDevice _device = new();
    private readonly Dispatcher _dispatcher;
    private readonly List<FingerprintStatusDto> _allStaff = [];

    private CancellationTokenSource? _captureCts;
    private CancellationTokenSource? _lifecycleCts;
    private string? _pendingTemplateBase64;
    private int _pendingTemplateLen;
    private int _pendingEmpCode;
    private string? _pendingStaffFullname;
    private bool _disposed;

    private int? _selectedDeptFilter;
    private FingerprintStaffFilter _filter = FingerprintStaffFilter.All;
    private FingerprintStaffFilter _selectedStatusFilter = FingerprintStaffFilter.All;
    private string _searchDraft = string.Empty;
    private string _appliedSearch = string.Empty;
    private FingerprintEnrollStaffRow? _selectedStaff;
    private bool _isLoading;
    private bool _hasListLoaded;
    private bool _isRefreshing;
    private bool _isRegistering;
    private bool _isAutoConnecting;
    private int _enrollStep;
    private string? _bannerMessage;
    private FingerprintBannerTone _bannerTone = FingerprintBannerTone.None;
    private bool _isDeviceConnected;
    private ImageSource? _previewImage;
    private List<FingerprintStatusDto> _filteredStaffSource = [];
    private int _currentPage = 1;
    private int _pageSize = 20;

    public FingerprintEnrollViewModel(AppMode mode, AdminApiClient? adminApi, HeadApiClient? headApi, string? deptName = null)
    {
        _mode = mode;
        _adminApi = adminApi;
        _headApi = headApi;
        _pageTitle = mode == AppMode.Head
            ? HeadPageTitleFormatter.Format(UtilitiesUiStrings.FingerprintEnroll.PageTitle, deptName)
            : UtilitiesUiStrings.FingerprintEnroll.PageTitle;
        _dispatcher = Dispatcher.CurrentDispatcher;

        FilteredStaff = new ObservableCollection<FingerprintEnrollStaffRow>();
        DeptFilterOptions = new ObservableCollection<DeptFilterOption>();
        StatusFilterOptions =
        [
            new FingerprintStatusFilterOption(FingerprintStaffFilter.All, UtilitiesUiStrings.FingerprintEnroll.FilterAll),
            new FingerprintStatusFilterOption(FingerprintStaffFilter.Missing, UtilitiesUiStrings.FingerprintEnroll.FilterMissing),
            new FingerprintStatusFilterOption(FingerprintStaffFilter.Registered, UtilitiesUiStrings.FingerprintEnroll.FilterRegistered)
        ];
        _selectedStatusFilter = FingerprintStaffFilter.All;
        ActiveFilter = FingerprintStaffFilter.All;

        SearchCommand = new RelayCommand(async () => await SearchStaffAsync(), () => IsFilterEnabled);
        ResetFiltersCommand = new RelayCommand(async () => await ResetFiltersAsync(), () => IsFilterEnabled);
        RefreshCommand = new RelayCommand(async () => await RefreshStaffAsync(), () => IsFilterEnabled && !IsRegistering);
        ConnectDeviceCommand = new RelayCommand(async () => await ConnectDeviceAsync(), () => !IsDeviceConnected && !IsRegistering);
        DisconnectDeviceCommand = new RelayCommand(DisconnectDevice, () => IsDeviceConnected && !IsRegistering);
        StartEnrollCommand = new RelayCommand(async () => await StartEnrollAsync(), () => CanStartEnroll);
        CancelEnrollCommand = new RelayCommand(CancelEnroll, () => IsRegistering);
        GoToPageCommand = new RelayCommand<int>(
            ChangePage,
            page => page >= 1 && page <= TotalPages);

        _lifecycleCts = new CancellationTokenSource();
        WpfUsbShare.ClaimEnrollLease();
        _ = InitializeAsync();
        _ = StartDeviceWatchAsync(_lifecycleCts.Token);
    }

    public ObservableCollection<FingerprintEnrollStaffRow> FilteredStaff { get; }
    public ObservableCollection<DeptFilterOption> DeptFilterOptions { get; }
    public IReadOnlyList<FingerprintStatusFilterOption> StatusFilterOptions { get; }

    public ICommand SearchCommand { get; }
    public ICommand ResetFiltersCommand { get; }
    public ICommand RefreshCommand { get; }
    public ICommand ConnectDeviceCommand { get; }
    public ICommand DisconnectDeviceCommand { get; }
    public ICommand StartEnrollCommand { get; }
    public ICommand CancelEnrollCommand { get; }
    public ICommand GoToPageCommand { get; }

    public bool HasFilteredStaff => TotalItems > 0;

    public bool ShowStaffListEmpty => !IsLoading && TotalItems == 0;

    public string UnitLabel => UtilitiesUiStrings.FingerprintEnroll.UnitLabel;

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
                ApplyPaging(resetPage: true);
            }
        }
    }

    public IReadOnlyList<int> PageSizeOptions { get; } = DefaultPageSizeOptions;

    public int TotalItems => _filteredStaffSource.Count;

    public int TotalPages => TotalItems == 0
        ? 1
        : (int)Math.Ceiling(TotalItems / (double)_pageSize);

    public bool ShowPagination => true;

    public bool IsAdminMode => _mode == AppMode.Admin;

    public string PageTitle => _pageTitle;
    public string PageSubtitle => IsAdminMode
        ? UtilitiesUiStrings.FingerprintEnroll.PageSubtitle
        : string.Empty;

    public bool IsLoading
    {
        get => _isLoading;
        private set
        {
            if (SetProperty(ref _isLoading, value))
            {
                NotifyStartEnrollStateChanged();
                OnPropertyChanged(nameof(ShowStaffListEmpty));
                OnPropertyChanged(nameof(IsFilterEnabled));
                CommandManager.InvalidateRequerySuggested();
            }
        }
    }

    public bool IsRefreshing
    {
        get => _isRefreshing;
        private set
        {
            if (SetProperty(ref _isRefreshing, value))
            {
                NotifyStartEnrollStateChanged();
                OnPropertyChanged(nameof(IsFilterEnabled));
                CommandManager.InvalidateRequerySuggested();
            }
        }
    }

    public bool IsRegistering
    {
        get => _isRegistering;
        private set
        {
            if (SetProperty(ref _isRegistering, value))
            {
                OnPropertyChanged(nameof(IsFilterEnabled));
                OnPropertyChanged(nameof(ShowScanProgressBadge));
                OnPropertyChanged(nameof(ScanProgressBadgeText));
                CommandManager.InvalidateRequerySuggested();
            }
        }
    }

    public bool IsFilterEnabled => !IsRegistering && !IsLoading && !IsRefreshing;

    public bool IsAutoConnecting
    {
        get => _isAutoConnecting;
        private set
        {
            if (SetProperty(ref _isAutoConnecting, value))
            {
                NotifyStartEnrollStateChanged();
            }
        }
    }

    public int EnrollStep
    {
        get => _enrollStep;
        private set
        {
            if (SetProperty(ref _enrollStep, value))
            {
                OnPropertyChanged(nameof(ShowScanProgressBadge));
                OnPropertyChanged(nameof(ScanProgressBadgeText));
            }
        }
    }

    public bool ShowScanProgressBadge => IsRegistering && EnrollStep > 0;

    public string ScanProgressBadgeText =>
        UtilitiesUiStrings.FingerprintEnroll.ScanProgressBadge(EnrollStep);

    public string? BannerMessage
    {
        get => _bannerMessage;
        private set
        {
            if (SetProperty(ref _bannerMessage, value))
            {
                OnPropertyChanged(nameof(HasBanner));
            }
        }
    }

    public FingerprintBannerTone BannerTone
    {
        get => _bannerTone;
        private set
        {
            if (SetProperty(ref _bannerTone, value))
            {
                OnPropertyChanged(nameof(HasBanner));
            }
        }
    }

    public bool HasBanner =>
        !string.IsNullOrWhiteSpace(BannerMessage) && BannerTone != FingerprintBannerTone.None;

    public bool IsDeviceConnected
    {
        get => _isDeviceConnected;
        private set
        {
            if (SetProperty(ref _isDeviceConnected, value))
            {
                OnPropertyChanged(nameof(DeviceStatusText));
                NotifyStartEnrollStateChanged();
            }
        }
    }

    public string DeviceStatusText => IsDeviceConnected
        ? UtilitiesUiStrings.FingerprintEnroll.DeviceConnected
        : UtilitiesUiStrings.FingerprintEnroll.DeviceDisconnected;

    public ImageSource? PreviewImage
    {
        get => _previewImage;
        private set => SetProperty(ref _previewImage, value);
    }

    public FingerprintStaffFilter ActiveFilter
    {
        get => _filter;
        private set => SetProperty(ref _filter, value);
    }

    public FingerprintStaffFilter SelectedStatusFilter
    {
        get => _selectedStatusFilter;
        set => SetProperty(ref _selectedStatusFilter, value);
    }

    public string SearchDraft
    {
        get => _searchDraft;
        set => SetProperty(ref _searchDraft, value);
    }

    public int? SelectedDeptFilter
    {
        get => _selectedDeptFilter;
        set => SetProperty(ref _selectedDeptFilter, value);
    }

    public FingerprintEnrollStaffRow? SelectedStaff
    {
        get => _selectedStaff;
        set
        {
            if (SetProperty(ref _selectedStaff, value))
            {
                NotifyStartEnrollStateChanged();
                if (!IsRegistering)
                {
                    SetBanner(
                        value == null ? null : UtilitiesUiStrings.FingerprintEnroll.PreviewGateHint,
                        value == null ? FingerprintBannerTone.None : FingerprintBannerTone.Info);
                }
            }
        }
    }

    public bool CanStartEnroll =>
        IsDeviceConnected && SelectedStaff != null && !IsRegistering && !IsLoading && !IsRefreshing && !IsAutoConnecting;

    public string StartEnrollTooltip
    {
        get
        {
            if (CanStartEnroll)
            {
                return string.Empty;
            }

            if (IsAutoConnecting)
            {
                return UtilitiesUiStrings.FingerprintEnroll.StartEnrollTooltipWaitingDevice;
            }

            if (!IsDeviceConnected)
            {
                return UtilitiesUiStrings.FingerprintEnroll.StartEnrollTooltip;
            }

            return UtilitiesUiStrings.FingerprintEnroll.StartEnrollTooltip;
        }
    }

    public event EventHandler? FingerLabelRequired;
    public event EventHandler<FingerprintEnrollCompletedEventArgs>? EnrollCompleted;
    public event EventHandler<FingerprintEnrollFailedEventArgs>? EnrollFailed;

    /// <summary>Shows validation feedback when start is blocked (e.g. button clicked while visually enabled).</summary>
    public void NotifyStartBlocked()
    {
        if (SelectedStaff == null)
        {
            SetBanner(UtilitiesUiStrings.FingerprintEnroll.StartBlockedNoStaff, FingerprintBannerTone.Warning, playSound: true);
            return;
        }

        if (!IsDeviceConnected)
        {
            SetBanner(UtilitiesUiStrings.FingerprintEnroll.StartBlockedNoDevice, FingerprintBannerTone.Warning, playSound: true);
        }
    }

    private async Task InitializeAsync()
    {
        if (IsAdminMode)
        {
            await LoadDepartmentsAsync();
        }

        await SearchStaffAsync();
        _ = TryAutoConnectAsync(_lifecycleCts?.Token ?? CancellationToken.None, showRetryBanner: true);
    }

    private async Task SearchStaffAsync()
    {
        _appliedSearch = SearchDraft.Trim();
        ActiveFilter = SelectedStatusFilter;
        await LoadStaffAsync();
    }

    private async Task ResetFiltersAsync()
    {
        SearchDraft = string.Empty;
        if (_selectedDeptFilter != null)
        {
            _selectedDeptFilter = null;
            OnPropertyChanged(nameof(SelectedDeptFilter));
        }

        if (_selectedStatusFilter != FingerprintStaffFilter.All)
        {
            _selectedStatusFilter = FingerprintStaffFilter.All;
            OnPropertyChanged(nameof(SelectedStatusFilter));
        }

        await SearchStaffAsync();
    }

    private async Task RefreshStaffAsync()
    {
        ActiveFilter = SelectedStatusFilter;
        await LoadStaffAsync();
    }

    private async Task LoadDepartmentsAsync()
    {
        if (_adminApi == null)
        {
            return;
        }

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
            SetBanner(ExtractMessage(ex), FingerprintBannerTone.Danger);
        }
    }

    private async Task LoadStaffAsync()
    {
        ListLoadBusy.Begin(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);

        try
        {
            List<FingerprintStatusDto> data;
            if (_mode == AppMode.Admin)
            {
                data = await (_adminApi?.ListFingerprintsAsync(SelectedDeptFilter) ?? Task.FromResult(new List<FingerprintStatusDto>()));
            }
            else
            {
                data = await (_headApi?.ListFingerprintsAsync() ?? Task.FromResult(new List<FingerprintStatusDto>()));
            }

            _allStaff.Clear();
            _allStaff.AddRange(data.OrderBy(x => x.EmpCode));
            ApplyStaffFilter();
        }
        catch (Exception ex)
        {
            SetBanner(ExtractMessage(ex), FingerprintBannerTone.Danger);
            _allStaff.Clear();
            ApplyStaffFilter();
        }
        finally
        {
            ListLoadBusy.End(ref _hasListLoaded, v => IsLoading = v, v => IsRefreshing = v);
        }
    }

    private void ApplyStaffFilter()
    {
        IEnumerable<FingerprintStatusDto> query = _allStaff;
        query = ActiveFilter switch
        {
            FingerprintStaffFilter.Missing => query.Where(x => !x.Registered),
            FingerprintStaffFilter.Registered => query.Where(x => x.Registered),
            _ => query
        };

        if (!string.IsNullOrWhiteSpace(_appliedSearch))
        {
            var q = _appliedSearch.ToLowerInvariant();
            query = query.Where(x =>
                (x.Fullname ?? string.Empty).ToLowerInvariant().Contains(q)
                || x.EmpCode.ToString().Contains(q, StringComparison.Ordinal)
                || (x.EmpCodeFormatted ?? string.Empty).Contains(q, StringComparison.OrdinalIgnoreCase));
        }

        _filteredStaffSource = query.ToList();
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

        var selectedEmpCode = SelectedStaff?.EmpCode;
        FilteredStaff.Clear();

        var startIndex = (_currentPage - 1) * _pageSize;
        var pageItems = _filteredStaffSource.Skip(startIndex).Take(_pageSize).ToList();
        for (var i = 0; i < pageItems.Count; i++)
        {
            FilteredStaff.Add(new FingerprintEnrollStaffRow(pageItems[i], startIndex + i + 1));
        }

        if (selectedEmpCode != null)
        {
            SelectedStaff = FilteredStaff.FirstOrDefault(x => x.EmpCode == selectedEmpCode);
        }
        else if (FilteredStaff.Count > 0)
        {
            SelectedStaff = FilteredStaff[0];
        }
        else
        {
            SelectedStaff = null;
        }

        OnPropertyChanged(nameof(CurrentPage));
        OnPropertyChanged(nameof(TotalPages));
        OnPropertyChanged(nameof(TotalItems));
        OnPropertyChanged(nameof(ShowPagination));
        OnPropertyChanged(nameof(HasFilteredStaff));
        OnPropertyChanged(nameof(ShowStaffListEmpty));
    }

    private async Task ConnectDeviceAsync()
    {
        await WaitForKioskYieldAsync(_lifecycleCts?.Token ?? CancellationToken.None, showBanner: true);

        if (TryConnectDevice(out var error))
        {
            RunOnUi(() => SetBanner(UtilitiesUiStrings.FingerprintEnroll.ConnectSuccessHint, FingerprintBannerTone.Success));
        }
        else if (error != null)
        {
            RunOnUi(() => SetBanner(error, FingerprintBannerTone.Danger, playSound: true));
        }
    }

    private bool TryConnectDevice(out string? errorMessage)
    {
        errorMessage = null;
        try
        {
            _device.Connect();
            RunOnUi(() => IsDeviceConnected = true);
            return true;
        }
        catch (Exception ex)
        {
            errorMessage = ResolveConnectError(ex);
        }

        return false;
    }

    private static string ResolveConnectError(Exception? ex)
    {
        if (ex is DllNotFoundException)
        {
            return ex.Message;
        }

        if (WpfAgentPresence.IsKioskAgentRunning() && !WpfUsbShare.IsAgentYielded())
        {
            return UtilitiesUiStrings.FingerprintEnroll.DeviceHeldByKiosk;
        }

        return ex?.Message ?? UtilitiesUiStrings.FingerprintEnroll.AutoConnectFail;
    }

    private async Task WaitForKioskYieldAsync(CancellationToken cancellationToken, bool showBanner)
    {
        if (_disposed || !WpfAgentPresence.IsKioskAgentRunning() || WpfUsbShare.IsAgentYielded())
        {
            return;
        }

        if (showBanner)
        {
            RunOnUi(() => SetBanner(
                UtilitiesUiStrings.FingerprintEnroll.WaitingForKioskYield,
                FingerprintBannerTone.Info));
        }

        try
        {
            await Task.Run(
                () => WpfUsbShare.WaitUntilAgentYielded(
                    TimeSpan.FromMilliseconds(WpfUsbShare.EnrollYieldWaitMs),
                    cancellationToken),
                cancellationToken);
        }
        catch (OperationCanceledException)
        {
            // page disposed
        }
    }

    private async Task TryAutoConnectAsync(CancellationToken cancellationToken, bool showRetryBanner)
    {
        if (IsDeviceConnected || _disposed)
        {
            return;
        }

        await WaitForKioskYieldAsync(cancellationToken, showBanner: showRetryBanner);

        if (IsDeviceConnected || _disposed || cancellationToken.IsCancellationRequested)
        {
            return;
        }

        RunOnUi(() => IsAutoConnecting = true);

        try
        {
            for (var attempt = 0; attempt < AutoConnectMaxAttempts && !cancellationToken.IsCancellationRequested; attempt++)
            {
                if (IsDeviceConnected)
                {
                    return;
                }

                if (attempt == 0)
                {
                    await Task.Delay(AutoConnectFirstDelayMs, cancellationToken);
                }
                else if (showRetryBanner)
                {
                    var attemptNumber = attempt + 1;
                    RunOnUi(() => SetBanner(
                        UtilitiesUiStrings.FingerprintEnroll.AutoConnectRetry(attemptNumber, AutoConnectMaxAttempts),
                        FingerprintBannerTone.Warning));
                    await Task.Delay(AutoConnectRetryDelayMs, cancellationToken);
                }
                else
                {
                    await Task.Delay(AutoConnectRetryDelayMs, cancellationToken);
                }

                var connected = await Task.Run(() =>
                {
                    try
                    {
                        _device.Connect();
                        return true;
                    }
                    catch
                    {
                        return false;
                    }
                }, cancellationToken);

                if (!connected)
                {
                    if (WpfAgentPresence.IsKioskAgentRunning() && !WpfUsbShare.IsAgentYielded())
                    {
                        RunOnUi(() => SetBanner(
                            UtilitiesUiStrings.FingerprintEnroll.DeviceHeldByKiosk,
                            FingerprintBannerTone.Warning,
                            playSound: showRetryBanner));
                        return;
                    }

                    continue;
                }

                RunOnUi(() =>
                {
                    IsDeviceConnected = true;
                    SetBanner(UtilitiesUiStrings.FingerprintEnroll.AutoConnectSuccess, FingerprintBannerTone.Success);
                });
                return;
            }

            if (!IsDeviceConnected && showRetryBanner && !cancellationToken.IsCancellationRequested)
            {
                RunOnUi(() => SetBanner(ResolveConnectError(null), FingerprintBannerTone.Warning, playSound: true));
            }
        }
        catch (OperationCanceledException)
        {
            // page disposed
        }
        finally
        {
            RunOnUi(() => IsAutoConnecting = false);
        }
    }

    private async Task StartDeviceWatchAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested && !_disposed)
        {
            try
            {
                await Task.Delay(DeviceWatchIntervalMs, cancellationToken);

                if (IsDeviceConnected || IsRegistering || IsAutoConnecting || _disposed)
                {
                    continue;
                }

                if (!ZkFingerprintDevice.IsNativeLibraryAvailable())
                {
                    continue;
                }

                if (!ZkFingerprintDevice.ProbeHardwarePresent())
                {
                    continue;
                }

                if (WpfAgentPresence.IsKioskAgentRunning() && !WpfUsbShare.IsAgentYielded())
                {
                    continue;
                }

                await TryAutoConnectAsync(cancellationToken, showRetryBanner: false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private void DisconnectDevice()
    {
        CancelEnroll();
        _device.Disconnect();
        IsDeviceConnected = false;
        PreviewImage = null;
        SetBanner(null, FingerprintBannerTone.None);
    }

    private async Task StartEnrollAsync()
    {
        if (SelectedStaff == null || !IsDeviceConnected)
        {
            NotifyStartBlocked();
            return;
        }

        _captureCts?.Cancel();
        _captureCts?.Dispose();

        FingerprintTraceLog.Clear();

        await RunOnUiAsync(() =>
        {
            EnrollStep = 0;
            IsRegistering = true;
            PreviewImage = null;
            SetBanner(UtilitiesUiStrings.FingerprintEnroll.EnrollScanStart, FingerprintBannerTone.Info);
        });

        _captureCts = new CancellationTokenSource();
        var staffFullname = SelectedStaff.Fullname;
        var token = _captureCts.Token;

        try
        {
            var result = await _device.BeginEnrollAsync(
                _dispatcher,
                HandleEnrollEvent,
                token);

            if (token.IsCancellationRequested || result.Cancelled)
            {
                return;
            }

            if (!string.IsNullOrWhiteSpace(result.ErrorMessage))
            {
                await RunOnUiAsync(() => SetBanner(result.ErrorMessage, FingerprintBannerTone.Danger, playSound: true));
                await _dispatcher.InvokeAsync(() =>
                    EnrollFailed?.Invoke(this, new FingerprintEnrollFailedEventArgs(result.ErrorMessage)));
                return;
            }

            if (result.SampleCount < 3 || result.MergedBase64 == null)
            {
                await RunOnUiAsync(() =>
                    SetBanner(UtilitiesUiStrings.FingerprintEnroll.EnrollIncomplete, FingerprintBannerTone.Warning, playSound: true));
                return;
            }

            await RunOnUiAsync(() =>
            {
                EnrollStep = 3;
                SetBanner(UtilitiesUiStrings.FingerprintEnroll.EnrollReadyForLabel, FingerprintBannerTone.Success);
            });

            _pendingTemplateBase64 = result.MergedBase64;
            _pendingTemplateLen = result.MergedLength;
            _pendingEmpCode = SelectedStaff.EmpCode;
            _pendingStaffFullname = staffFullname;

            await _dispatcher.InvokeAsync(() => FingerLabelRequired?.Invoke(this, EventArgs.Empty));
        }
        catch (OperationCanceledException)
        {
            // cancelled
        }
        catch (Exception ex)
        {
            var message = ExtractMessage(ex);
            await RunOnUiAsync(() => SetBanner(message, FingerprintBannerTone.Danger, playSound: true));
            await _dispatcher.InvokeAsync(() =>
                EnrollFailed?.Invoke(this, new FingerprintEnrollFailedEventArgs(message)));
        }
        finally
        {
            if (_pendingTemplateBase64 == null)
            {
                await RunOnUiAsync(ResetEnrollState);
            }
        }
    }

    private void HandleEnrollEvent(FingerprintEnrollEvent evt)
    {
        switch (evt.Kind)
        {
            case FingerprintEnrollEventKind.SameFingerRejected:
                SetBanner(
                    $"{UtilitiesUiStrings.FingerprintEnroll.SameFingerError} {UtilitiesUiStrings.FingerprintEnroll.LiftFingerHint}",
                    FingerprintBannerTone.Warning,
                    playSound: true);
                if (evt.Capture != null)
                {
                    UpdatePreview(evt.Capture);
                }

                break;

            case FingerprintEnrollEventKind.MergeFailed:
                SetBanner(evt.ErrorMessage ?? UtilitiesUiStrings.FingerprintEnroll.MergeFail, FingerprintBannerTone.Danger, playSound: true);
                break;

            case FingerprintEnrollEventKind.SampleAccepted:
                EnrollStep = evt.CompletedScans;
                if (evt.Capture != null)
                {
                    UpdatePreview(evt.Capture);
                }

                if (evt.CompletedScans < 3)
                {
                    var liftHint = evt.CompletedScans >= 1
                        ? $" {UtilitiesUiStrings.FingerprintEnroll.LiftFingerHint}"
                        : string.Empty;
                    SetBanner(
                        UtilitiesUiStrings.FingerprintEnroll.ScanAgain(evt.CompletedScans) + liftHint,
                        FingerprintBannerTone.Info);
                }
                else
                {
                    SetBanner(UtilitiesUiStrings.FingerprintEnroll.MergeInProgress, FingerprintBannerTone.Info);
                }

                break;
        }
    }

    public async Task SubmitFingerLabelAsync(string fingerLabel)
    {
        if (string.IsNullOrWhiteSpace(fingerLabel) || _pendingTemplateBase64 == null)
        {
            SetBanner(UtilitiesUiStrings.FingerprintEnroll.FingerLabelRequired, FingerprintBannerTone.Warning, playSound: true);
            ResetEnrollState();
            return;
        }

        SetBanner(UtilitiesUiStrings.FingerprintEnroll.EnrollSaving, FingerprintBannerTone.Info);

        try
        {
            var request = new FingerprintEnrollRequest
            {
                EmpCode = _pendingEmpCode,
                TemplateBase64 = _pendingTemplateBase64,
                TemplateLen = _pendingTemplateLen,
                FingerIndex = 0,
                ZkFid = _pendingEmpCode,
                FingerLabel = fingerLabel.Trim()
            };

            if (_mode == AppMode.Admin)
            {
                await (_adminApi?.EnrollFingerprintAsync(request) ?? Task.FromResult(new FingerprintStatusDto()));
            }
            else
            {
                await (_headApi?.EnrollFingerprintAsync(request) ?? Task.FromResult(new FingerprintStatusDto()));
            }

            var fullname = _pendingStaffFullname ?? string.Empty;
            var successMessage = UtilitiesUiStrings.FingerprintEnroll.EnrollSuccessDetail(fullname);
            SetBanner(successMessage, FingerprintBannerTone.Success, playSound: true);
            await LoadStaffAsync();
            await _dispatcher.InvokeAsync(() =>
                EnrollCompleted?.Invoke(this, new FingerprintEnrollCompletedEventArgs(fullname, successMessage)));
        }
        catch (Exception ex)
        {
            var message = ExtractMessage(ex);
            SetBanner(message, FingerprintBannerTone.Danger, playSound: true);
            EnrollFailed?.Invoke(this, new FingerprintEnrollFailedEventArgs(message));
        }
        finally
        {
            _pendingTemplateBase64 = null;
            _pendingStaffFullname = null;
            ResetEnrollState();
        }
    }

    public void CancelPendingEnroll()
    {
        _pendingTemplateBase64 = null;
        _pendingStaffFullname = null;
        SetBanner(UtilitiesUiStrings.FingerprintEnroll.CancelFingerLabel, FingerprintBannerTone.Warning, playSound: true);
        ResetEnrollState();
    }

    private void CancelEnroll()
    {
        _captureCts?.Cancel();
        _device.CancelEnroll();
        _pendingTemplateBase64 = null;
        _pendingStaffFullname = null;
        SetBanner(UtilitiesUiStrings.FingerprintEnroll.CancelEnrollMid, FingerprintBannerTone.Info);
        ResetEnrollState();
    }

    private void ResetEnrollState()
    {
        IsRegistering = false;
        EnrollStep = 0;
        PreviewImage = null;
        _captureCts?.Dispose();
        _captureCts = null;
    }

    private void SetBanner(string? message, FingerprintBannerTone tone, bool playSound = false)
    {
        if (!_dispatcher.CheckAccess())
        {
            _dispatcher.Invoke(() => SetBanner(message, tone, playSound));
            return;
        }

        BannerMessage = message;
        BannerTone = string.IsNullOrWhiteSpace(message) ? FingerprintBannerTone.None : tone;

        if (playSound)
        {
            DesktopSoundService.Play(tone);
        }
    }

    private void RunOnUi(Action action)
    {
        if (_dispatcher.CheckAccess())
        {
            action();
            return;
        }

        _dispatcher.Invoke(action);
    }

    private Task RunOnUiAsync(Action action)
    {
        if (_dispatcher.CheckAccess())
        {
            action();
            return Task.CompletedTask;
        }

        return _dispatcher.InvokeAsync(action).Task;
    }

    private void NotifyStartEnrollStateChanged()
    {
        OnPropertyChanged(nameof(CanStartEnroll));
        OnPropertyChanged(nameof(StartEnrollTooltip));
        CommandManager.InvalidateRequerySuggested();
    }

    private void UpdatePreview(FingerprintCapturePayload capture)
    {
        if (!_dispatcher.CheckAccess())
        {
            RunOnUi(() => UpdatePreview(capture));
            return;
        }

        try
        {
            PreviewImage = Helpers.FingerprintPreviewHelper.CreateGrayBitmap(
                capture.Image,
                capture.ImageWidth,
                capture.ImageHeight);
        }
        catch
        {
            PreviewImage = null;
        }
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _lifecycleCts?.Cancel();
        _lifecycleCts?.Dispose();
        _lifecycleCts = null;
        CancelEnroll();
        _device.Dispose();
        WpfUsbShare.ReleaseEnrollLease();
    }

    private static string ExtractMessage(Exception ex) =>
        ex is ApiException apiEx && !string.IsNullOrWhiteSpace(apiEx.Message)
            ? apiEx.Message
            : ex.Message;
}

public sealed class FingerprintEnrollCompletedEventArgs : EventArgs
{
    public FingerprintEnrollCompletedEventArgs(string fullname, string message)
    {
        Fullname = fullname;
        Message = message;
    }

    public string Fullname { get; }
    public string Message { get; }
}

public sealed class FingerprintEnrollFailedEventArgs : EventArgs
{
    public FingerprintEnrollFailedEventArgs(string message)
    {
        Message = message;
    }

    public string Message { get; }
}
