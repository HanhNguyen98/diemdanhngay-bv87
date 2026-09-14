using System.Collections.Concurrent;
using System.Windows;
using System.Windows.Media.Imaging;
using System.Windows.Threading;
using BV87.App.Agent;
using BV87.App.Hardware;
using BV87.App.Services;
using BV87.App.ViewModels;
using BV87.App.ViewModels.Utilities;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Config;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Kiosk;

namespace BV87.App.ViewModels.Agent;

public sealed class AgentScanViewModel : ViewModelBase, IDisposable
{
    private const int ScanDebounceMs = 2_000;
    private const int DeviceWatchIntervalMs = 2_500;
    private const int AutoConnectFirstDelayMs = 400;

    private readonly AgentConfig _config;
    private readonly KioskApiClient _api;
    private readonly ZkFingerprintDevice _device = new();
    private readonly Dispatcher _dispatcher;
    private readonly ConcurrentDictionary<int, long> _lastScanPostMs = new();
    private readonly object _scanGate = new();

    private CancellationTokenSource? _lifecycleCts;
    private bool _disposed;
    private bool _scanInFlight;
    private bool _scanModeActive;
    private bool _usbYieldedToEnroll;

    private string? _bannerMessage;
    private FingerprintBannerTone _bannerTone = FingerprintBannerTone.Info;
    private WriteableBitmap? _previewImage;
    private string _deptDisplay = "—";
    private string _kioskLabel = "—";
    private string _templateCountText = "0";
    private string _deviceStatusText = AgentUiStrings.DeviceStatusDisconnected;
    private bool _isDeviceConnected;

    public AgentScanViewModel(AgentConfig config, KioskApiClient api)
    {
        _config = config;
        _api = api;
        _dispatcher = Application.Current.Dispatcher;
        _lifecycleCts = new CancellationTokenSource();
    }

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
        private set => SetProperty(ref _bannerTone, value);
    }

    public bool HasBanner => !string.IsNullOrWhiteSpace(BannerMessage) && BannerTone != FingerprintBannerTone.None;

    public WriteableBitmap? PreviewImage
    {
        get => _previewImage;
        private set
        {
            if (SetProperty(ref _previewImage, value))
            {
                OnPropertyChanged(nameof(HasPreviewImage));
            }
        }
    }

    public bool HasPreviewImage => PreviewImage != null;

    public string DeptDisplay
    {
        get => _deptDisplay;
        private set => SetProperty(ref _deptDisplay, value);
    }

    public string KioskLabel
    {
        get => _kioskLabel;
        private set => SetProperty(ref _kioskLabel, value);
    }

    public string TemplateCountText
    {
        get => _templateCountText;
        private set => SetProperty(ref _templateCountText, value);
    }

    public string DeviceStatusText
    {
        get => _deviceStatusText;
        private set => SetProperty(ref _deviceStatusText, value);
    }

    public bool IsDeviceConnected
    {
        get => _isDeviceConnected;
        private set
        {
            if (SetProperty(ref _isDeviceConnected, value))
            {
                RefreshDeviceStatusText();
            }
        }
    }

    private void RefreshDeviceStatusText()
    {
        DeviceStatusText = _usbYieldedToEnroll
            ? AgentUiStrings.DeviceStatusPausedEnroll
            : IsDeviceConnected
                ? AgentUiStrings.DeviceStatusConnected
                : AgentUiStrings.DeviceStatusDisconnected;
    }

    public async Task InitializeAsync()
    {
        var token = _lifecycleCts?.Token ?? CancellationToken.None;

        try
        {
            var health = await _api.GetHealthAsync(token);
            DeptDisplay = health.DepartmentDisplay();
            KioskLabel = string.IsNullOrWhiteSpace(health.Label) ? "—" : health.Label!;
            SetBanner(
                string.Format(AgentUiStrings.ConnectSystemOkNeedDevice, DeptDisplay),
                FingerprintBannerTone.Success);

            if (_config.HeartbeatEnabled)
            {
                _ = RunHeartbeatLoopAsync(token);
            }

            if (WpfUsbShare.IsEnrollLeaseHeld())
            {
                await YieldUsbToEnrollAsync();
            }
            else if (_config.DeviceAutoOpen)
            {
                await TryAutoConnectAsync(token, showRetryBanner: true);
            }
            else if (IsDeviceConnected)
            {
                await ReloadTemplatesAsync(showBanner: true, token);
            }

            _ = RunUsbShareWatchAsync(token);
            _ = RunDeviceWatchAsync(token);
            _ = RunTemplateReloadLoopAsync(token);
        }
        catch (Exception ex)
        {
            SetBanner(FormatApiError(AgentUiStrings.BootstrapFailed, ex), FingerprintBannerTone.Danger, playSound: true);
        }
    }

    private async Task RunHeartbeatLoopAsync(CancellationToken cancellationToken)
    {
        var interval = TimeSpan.FromSeconds(Math.Clamp(_config.HeartbeatIntervalSeconds, 15, 300));
        using var timer = new PeriodicTimer(interval);
        try
        {
            await SendHeartbeatSafeAsync(cancellationToken);
            while (await timer.WaitForNextTickAsync(cancellationToken))
            {
                await SendHeartbeatSafeAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            // shutdown
        }
    }

    private async Task SendHeartbeatSafeAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _api.SendHeartbeatAsync(cancellationToken);
        }
        catch
        {
            // heartbeat is best-effort
        }
    }

    private async Task RunTemplateReloadLoopAsync(CancellationToken cancellationToken)
    {
        var minutes = Math.Clamp(_config.TemplateReloadMinutes, 5, 240);
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(minutes));
        try
        {
            while (await timer.WaitForNextTickAsync(cancellationToken))
            {
                await ReloadTemplatesAsync(showBanner: false, cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            // shutdown
        }
    }

    private async Task ReloadTemplatesAsync(bool showBanner, CancellationToken cancellationToken)
    {
        if (_usbYieldedToEnroll || !IsDeviceConnected)
        {
            return;
        }

        try
        {
            var templates = await _api.ListTemplatesAsync(cancellationToken);
            var result = await _device.ReloadIdentifyTemplatesAsync(templates, cancellationToken);
            RunOnUi(() => TemplateCountText = result.Loaded.ToString());

            if (IsDeviceConnected)
            {
                RunOnUi(EnsureScanMode);
            }

            if (!showBanner)
            {
                return;
            }

            if (result.Total == 0)
            {
                SetBanner(AgentUiStrings.TemplatesEmpty, FingerprintBannerTone.Warning);
                return;
            }

            if (result.Loaded < result.Total)
            {
                SetBanner(
                    string.Format(
                        AgentUiStrings.TemplatesLoadedPartial,
                        result.Loaded,
                        result.Total,
                        result.Skipped),
                    FingerprintBannerTone.Warning);
                return;
            }

            SetBanner(
                string.Format(AgentUiStrings.TemplatesLoaded, result.Loaded, result.Total),
                FingerprintBannerTone.Success);
        }
        catch (Exception ex)
        {
            SetBanner(FormatApiError(AgentUiStrings.TemplateReloadFailed, ex), FingerprintBannerTone.Danger, playSound: true);
        }
    }

    private async Task TryAutoConnectAsync(CancellationToken cancellationToken, bool showRetryBanner)
    {
        if (_usbYieldedToEnroll || WpfUsbShare.IsEnrollLeaseHeld())
        {
            return;
        }

        for (var attempt = 0; attempt < _config.DeviceAutoOpenRetries && !cancellationToken.IsCancellationRequested; attempt++)
        {
            if (IsDeviceConnected || _usbYieldedToEnroll || WpfUsbShare.IsEnrollLeaseHeld())
            {
                return;
            }

            if (attempt == 0)
            {
                await Task.Delay(AutoConnectFirstDelayMs, cancellationToken);
            }
            else if (showRetryBanner)
            {
                RunOnUi(() => SetBanner(
                    AgentUiStrings.DeviceConnectRetry(attempt + 1, _config.DeviceAutoOpenRetries),
                    FingerprintBannerTone.Warning));
                await Task.Delay(_config.DeviceAutoOpenRetryMs, cancellationToken);
            }
            else
            {
                await Task.Delay(_config.DeviceAutoOpenRetryMs, cancellationToken);
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
                continue;
            }

            if (WpfUsbShare.IsEnrollLeaseHeld())
            {
                await YieldUsbToEnrollAsync();
                return;
            }

            if (_dispatcher.CheckAccess())
            {
                IsDeviceConnected = true;
            }
            else
            {
                await _dispatcher.InvokeAsync(() => IsDeviceConnected = true);
            }

            await ReloadTemplatesAsync(showBanner: true, cancellationToken);
            RunOnUi(EnsureScanMode);
            return;
        }

        if (showRetryBanner)
        {
            RunOnUi(() => SetBanner(AgentUiStrings.DeviceConnectFail, FingerprintBannerTone.Warning, playSound: true));
        }
    }

    private async Task RunDeviceWatchAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested && !_disposed)
        {
            try
            {
                await Task.Delay(DeviceWatchIntervalMs, cancellationToken);
                if (IsDeviceConnected || _disposed || _usbYieldedToEnroll || WpfUsbShare.IsEnrollLeaseHeld())
                {
                    continue;
                }

                if (!ZkFingerprintDevice.IsNativeLibraryAvailable() || !ZkFingerprintDevice.ProbeHardwarePresent())
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

    private async Task RunUsbShareWatchAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested && !_disposed)
        {
            try
            {
                await Task.Delay(WpfUsbShare.AgentPollMs, cancellationToken);
                if (_disposed)
                {
                    return;
                }

                if (WpfUsbShare.IsEnrollLeaseHeld())
                {
                    if (!_usbYieldedToEnroll)
                    {
                        await YieldUsbToEnrollAsync();
                    }

                    continue;
                }

                if (_usbYieldedToEnroll)
                {
                    await ReclaimUsbAfterEnrollAsync(cancellationToken);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task YieldUsbToEnrollAsync()
    {
        _usbYieldedToEnroll = true;
        _scanModeActive = false;

        await Task.Run(() =>
        {
            try
            {
                _device.EndScanMode();
                _device.Disconnect();
            }
            catch
            {
                // still publish yield so enroll can retry OpenDevice
            }
        });

        WpfUsbShare.SignalAgentYielded();
        RunOnUi(() =>
        {
            IsDeviceConnected = false;
            PreviewImage = null;
            RefreshDeviceStatusText();
            SetBanner(AgentUiStrings.UsbPausedForEnroll, FingerprintBannerTone.Warning);
        });
    }

    private async Task ReclaimUsbAfterEnrollAsync(CancellationToken cancellationToken)
    {
        WpfUsbShare.ClearAgentYielded();
        _usbYieldedToEnroll = false;
        RunOnUi(RefreshDeviceStatusText);

        await TryAutoConnectAsync(cancellationToken, showRetryBanner: true);

        if (IsDeviceConnected)
        {
            RunOnUi(() =>
            {
                if (BannerMessage == AgentUiStrings.UsbPausedForEnroll)
                {
                    SetBanner(AgentUiStrings.UsbResumedAfterEnroll, FingerprintBannerTone.Success);
                }
            });
        }
    }

    private void EnsureScanMode()
    {
        if (_scanModeActive || !IsDeviceConnected || _disposed)
        {
            return;
        }

        _device.BeginScanMode(_dispatcher, HandleScanEvent);
        _scanModeActive = true;
    }

    private void HandleScanEvent(FingerprintScanEvent evt)
    {
        if (_disposed)
        {
            return;
        }

        switch (evt.Kind)
        {
            case FingerprintScanEventKind.Preview:
                if (evt.Capture != null)
                {
                    UpdatePreview(evt.Capture);
                }

                break;

            case FingerprintScanEventKind.IdentifyFailed:
                SetBanner(AgentUiStrings.IdentifyFailed, FingerprintBannerTone.Warning, playSound: true);
                break;

            case FingerprintScanEventKind.IdentifyUnmapped:
                SetBanner(AgentUiStrings.IdentifyUnmapped, FingerprintBannerTone.Danger, playSound: true);
                break;

            case FingerprintScanEventKind.IdentifyMatched:
                _ = ProcessIdentifyMatchAsync(evt.EmpCode, evt.Score, evt.Fullname);
                break;
        }
    }

    private async Task ProcessIdentifyMatchAsync(int empCode, int score, string? fullname)
    {
        var now = Environment.TickCount64;
        if (_lastScanPostMs.TryGetValue(empCode, out var last) && now - last < ScanDebounceMs)
        {
            RunOnUi(() => SetBanner(
                AgentUiStrings.ScanDebounced(fullname ?? empCode.ToString("D5")),
                FingerprintBannerTone.Warning));
            return;
        }

        lock (_scanGate)
        {
            if (_scanInFlight)
            {
                RunOnUi(() => SetBanner(AgentUiStrings.ScanInFlight, FingerprintBannerTone.Warning));
                return;
            }

            _scanInFlight = true;
        }

        _lastScanPostMs[empCode] = now;

        try
        {
            var result = await _api.ScanAsync(empCode, score);
            var banner = AgentAttendanceBannerMapper.Map(result.Direction, result.Status, result.Message);
            var line = AgentAttendanceBannerMapper.FormatResultLine(result, banner);
            RunOnUi(() =>
            {
                SetBanner(line, banner.Tone, playSound: true);
            });
        }
        catch (Exception ex)
        {
            var banner = new AgentAttendanceBannerMapper.AttendanceBanner(AgentUiStrings.ScanApiError, FingerprintBannerTone.Danger);
            var line = AgentAttendanceBannerMapper.FormatResultLine(empCode, fullname, banner);
            var detail = ex.Message;
            if (!string.IsNullOrWhiteSpace(detail) && detail is not "HTTP 400" and not "HTTP 500")
            {
                line += " — " + detail;
            }

            RunOnUi(() => SetBanner(line, FingerprintBannerTone.Danger, playSound: true));
        }
        finally
        {
            lock (_scanGate)
            {
                _scanInFlight = false;
            }
        }
    }

    private void UpdatePreview(FingerprintCapturePayload capture)
    {
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

    private void SetBanner(string? message, FingerprintBannerTone tone, bool playSound = false)
    {
        BannerMessage = message;
        BannerTone = string.IsNullOrWhiteSpace(message) ? FingerprintBannerTone.None : tone;
        if (playSound && _config.SoundEnabled)
        {
            DesktopSoundService.Play(tone);
        }
    }

    private static string FormatApiError(string prefix, Exception ex) =>
        ex is ApiException api && !string.IsNullOrWhiteSpace(api.Message)
            ? $"{prefix} — {api.Message}"
            : prefix;

    private void RunOnUi(Action action)
    {
        if (_dispatcher.CheckAccess())
        {
            action();
            return;
        }

        _ = _dispatcher.BeginInvoke(action);
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
        _device.EndScanMode();
        _device.Dispose();
    }
}
