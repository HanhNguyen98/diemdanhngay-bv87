using System.Windows.Input;
using BV87.App;
using BV87.App.Helpers;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels.Settings;

public sealed class SystemSettingsViewModel : ViewModelBase
{
    private readonly AdminApiClient _adminApi;

    private bool _isLoading;
    private bool _isSaving;
    private string? _statusMessage;
    private string? _errorMessage;
    private string? _logoError;
    private string? _loginAvatarError;

    private string _portalTitle = string.Empty;
    private string? _logoUrl;
    private string? _loginAvatarUrl;
    private string _attendanceLockTime = WorkHoursDefaults.DefaultLockTime;
    private string _attendanceReminderTime = WorkHoursDefaults.DefaultReminderTime;
    private string _morningInOfficial = WorkHoursDefaults.MorningInOfficial;
    private string _noonOutOfficial = WorkHoursDefaults.NoonOutOfficial;
    private string _afternoonInOfficial = WorkHoursDefaults.AfternoonInOfficial;
    private string _afternoonOutOfficial = WorkHoursDefaults.AfternoonOutOfficial;
    private string _morningOpen = WorkHoursDefaults.MorningOpen;
    private string _midpoint1 = WorkHoursDefaults.Midpoint1;
    private string _midpointNoon = WorkHoursDefaults.MidpointNoon;
    private string _midpoint2 = WorkHoursDefaults.Midpoint2;
    private string _dayClose = WorkHoursDefaults.DayClose;
    private int _lateGraceMinutes = WorkHoursDefaults.LateGraceMinutes;
    private int _earlyGraceMinutes = WorkHoursDefaults.EarlyGraceMinutes;

    public SystemSettingsViewModel(AdminApiClient adminApi)
    {
        _adminApi = adminApi;
        SaveCommand = new RelayCommand(async () => await SaveAsync(), () => !IsSaving && !IsLoading);
        ResetWorkHoursCommand = new RelayCommand(ResetWorkHoursDraft);
        PickLogoCommand = new RelayCommand(() => PickImageRequested?.Invoke(this, true));
        PickLoginAvatarCommand = new RelayCommand(() => PickImageRequested?.Invoke(this, false));
        RemoveLogoCommand = new RelayCommand(() => LogoUrl = string.Empty);
        RemoveLoginAvatarCommand = new RelayCommand(() => LoginAvatarUrl = string.Empty);
        _ = LoadAsync();
    }

    public ICommand SaveCommand { get; }
    public ICommand ResetWorkHoursCommand { get; }
    public ICommand PickLogoCommand { get; }
    public ICommand PickLoginAvatarCommand { get; }
    public ICommand RemoveLogoCommand { get; }
    public ICommand RemoveLoginAvatarCommand { get; }

    public event EventHandler<bool>? PickImageRequested;

    public string PageTitle => SettingsUiStrings.System.PageTitle;
    public string PageSubtitle => SettingsUiStrings.System.PageSubtitle;
    public string SaveLabel => IsSaving ? SettingsUiStrings.Saving : SettingsUiStrings.SaveSettings;

    public string WindowMorningInPreview => $"{SettingsUiStrings.System.WindowMorningIn}: {_morningOpen} – {_midpoint1}";
    public string WindowNoonOutPreview => $"{SettingsUiStrings.System.WindowNoonOut}: {_midpoint1} – {_midpointNoon}";
    public string WindowAfternoonInPreview => $"{SettingsUiStrings.System.WindowAfternoonIn}: {_midpointNoon} – {_midpoint2}";
    public string WindowAfternoonOutPreview => $"{SettingsUiStrings.System.WindowAfternoonOut}: {_midpoint2} – {_dayClose}";

    public bool IsLoading
    {
        get => _isLoading;
        private set => SetProperty(ref _isLoading, value);
    }

    public bool IsSaving
    {
        get => _isSaving;
        private set
        {
            if (SetProperty(ref _isSaving, value))
            {
                OnPropertyChanged(nameof(SaveLabel));
            }
        }
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

    public string? LogoError
    {
        get => _logoError;
        private set => SetProperty(ref _logoError, value);
    }

    public string? LoginAvatarError
    {
        get => _loginAvatarError;
        private set => SetProperty(ref _loginAvatarError, value);
    }

    public string PortalTitle
    {
        get => _portalTitle;
        set => SetProperty(ref _portalTitle, value);
    }

    public string? LogoUrl
    {
        get => _logoUrl;
        set => SetProperty(ref _logoUrl, value);
    }

    public string? LoginAvatarUrl
    {
        get => _loginAvatarUrl;
        set => SetProperty(ref _loginAvatarUrl, value);
    }

    public string AttendanceLockTime
    {
        get => _attendanceLockTime;
        set => SetProperty(ref _attendanceLockTime, value);
    }

    public string AttendanceReminderTime
    {
        get => _attendanceReminderTime;
        set => SetProperty(ref _attendanceReminderTime, value);
    }

    public string MorningInOfficial
    {
        get => _morningInOfficial;
        set => SetProperty(ref _morningInOfficial, value);
    }

    public string NoonOutOfficial
    {
        get => _noonOutOfficial;
        set => SetProperty(ref _noonOutOfficial, value);
    }

    public string AfternoonInOfficial
    {
        get => _afternoonInOfficial;
        set => SetProperty(ref _afternoonInOfficial, value);
    }

    public string AfternoonOutOfficial
    {
        get => _afternoonOutOfficial;
        set => SetProperty(ref _afternoonOutOfficial, value);
    }

    public string MorningOpen
    {
        get => _morningOpen;
        set { if (SetProperty(ref _morningOpen, value)) NotifyWindowPreview(); }
    }

    public string Midpoint1
    {
        get => _midpoint1;
        set { if (SetProperty(ref _midpoint1, value)) NotifyWindowPreview(); }
    }

    public string MidpointNoon
    {
        get => _midpointNoon;
        set { if (SetProperty(ref _midpointNoon, value)) NotifyWindowPreview(); }
    }

    public string Midpoint2
    {
        get => _midpoint2;
        set { if (SetProperty(ref _midpoint2, value)) NotifyWindowPreview(); }
    }

    public string DayClose
    {
        get => _dayClose;
        set { if (SetProperty(ref _dayClose, value)) NotifyWindowPreview(); }
    }

    public int LateGraceMinutes
    {
        get => _lateGraceMinutes;
        set => SetProperty(ref _lateGraceMinutes, value);
    }

    public int EarlyGraceMinutes
    {
        get => _earlyGraceMinutes;
        set => SetProperty(ref _earlyGraceMinutes, value);
    }

    public void ApplyPickedImage(bool isLogo, string dataUrl)
    {
        if (isLogo)
        {
            LogoUrl = dataUrl;
            LogoError = null;
        }
        else
        {
            LoginAvatarUrl = dataUrl;
            LoginAvatarError = null;
        }
    }

    public void SetImageError(bool isLogo, string message)
    {
        if (isLogo)
        {
            LogoError = message;
        }
        else
        {
            LoginAvatarError = message;
        }
    }

    private async Task LoadAsync()
    {
        IsLoading = true;
        ErrorMessage = null;
        try
        {
            var data = await _adminApi.GetBrandingAsync();
            PortalTitle = data.PortalTitle ?? string.Empty;
            LogoUrl = data.LogoUrl;
            LoginAvatarUrl = data.LoginAvatarUrl;
            AttendanceLockTime = data.AttendanceLockTime ?? WorkHoursDefaults.DefaultLockTime;
            AttendanceReminderTime = data.AttendanceReminderTime ?? WorkHoursDefaults.DefaultReminderTime;
            MorningInOfficial = data.MorningInOfficial ?? WorkHoursDefaults.MorningInOfficial;
            NoonOutOfficial = data.NoonOutOfficial ?? WorkHoursDefaults.NoonOutOfficial;
            AfternoonInOfficial = data.AfternoonInOfficial ?? WorkHoursDefaults.AfternoonInOfficial;
            AfternoonOutOfficial = data.AfternoonOutOfficial ?? WorkHoursDefaults.AfternoonOutOfficial;
            MorningOpen = data.MorningOpen ?? WorkHoursDefaults.MorningOpen;
            Midpoint1 = data.Midpoint1 ?? WorkHoursDefaults.Midpoint1;
            MidpointNoon = data.MidpointNoon ?? WorkHoursDefaults.MidpointNoon;
            Midpoint2 = data.Midpoint2 ?? WorkHoursDefaults.Midpoint2;
            DayClose = data.DayClose ?? WorkHoursDefaults.DayClose;
            LateGraceMinutes = data.LateGraceMinutes ?? WorkHoursDefaults.LateGraceMinutes;
            EarlyGraceMinutes = data.EarlyGraceMinutes ?? WorkHoursDefaults.EarlyGraceMinutes;
            NotifyWindowPreview();
        }
        catch (Exception ex)
        {
            ErrorMessage = ExtractMessage(ex);
        }
        finally
        {
            IsLoading = false;
        }
    }

    private async Task SaveAsync()
    {
        ErrorMessage = null;
        StatusMessage = null;

        if (!string.IsNullOrWhiteSpace(LogoError) || !string.IsNullOrWhiteSpace(LoginAvatarError))
        {
            ErrorMessage = LogoError ?? LoginAvatarError;
            return;
        }

        if (string.IsNullOrWhiteSpace(PortalTitle))
        {
            ErrorMessage = SettingsUiStrings.System.TitleRequired;
            return;
        }

        if (string.IsNullOrWhiteSpace(AttendanceLockTime))
        {
            ErrorMessage = SettingsUiStrings.System.LockTimeRequired;
            return;
        }

        if (string.IsNullOrWhiteSpace(AttendanceReminderTime))
        {
            ErrorMessage = SettingsUiStrings.System.ReminderTimeRequired;
            return;
        }

        IsSaving = true;
        try
        {
            await _adminApi.UpdateBrandingAsync(new BrandingUpdateRequest
            {
                PortalTitle = PortalTitle.Trim(),
                LogoUrl = LogoUrl,
                LoginAvatarUrl = LoginAvatarUrl,
                AttendanceLockTime = AttendanceLockTime,
                AttendanceReminderTime = AttendanceReminderTime,
                MorningInOfficial = MorningInOfficial,
                NoonOutOfficial = NoonOutOfficial,
                AfternoonInOfficial = AfternoonInOfficial,
                AfternoonOutOfficial = AfternoonOutOfficial,
                MorningOpen = MorningOpen,
                Midpoint1 = Midpoint1,
                MidpointNoon = MidpointNoon,
                Midpoint2 = Midpoint2,
                DayClose = DayClose,
                LateGraceMinutes = LateGraceMinutes,
                EarlyGraceMinutes = EarlyGraceMinutes
            });
            ShellToast.Success(ToastCopy.OkItem("lưu", "cấu hình hệ thống"));
            await App.Branding.ReloadAsync();
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.FailItem("lưu", "cấu hình hệ thống"));
        }
        finally
        {
            IsSaving = false;
        }
    }

    private void ResetWorkHoursDraft()
    {
        MorningInOfficial = WorkHoursDefaults.MorningInOfficial;
        NoonOutOfficial = WorkHoursDefaults.NoonOutOfficial;
        AfternoonInOfficial = WorkHoursDefaults.AfternoonInOfficial;
        AfternoonOutOfficial = WorkHoursDefaults.AfternoonOutOfficial;
        MorningOpen = WorkHoursDefaults.MorningOpen;
        Midpoint1 = WorkHoursDefaults.Midpoint1;
        MidpointNoon = WorkHoursDefaults.MidpointNoon;
        Midpoint2 = WorkHoursDefaults.Midpoint2;
        DayClose = WorkHoursDefaults.DayClose;
        LateGraceMinutes = WorkHoursDefaults.LateGraceMinutes;
        EarlyGraceMinutes = WorkHoursDefaults.EarlyGraceMinutes;
    }

    private void NotifyWindowPreview()
    {
        OnPropertyChanged(nameof(WindowMorningInPreview));
        OnPropertyChanged(nameof(WindowNoonOutPreview));
        OnPropertyChanged(nameof(WindowAfternoonOutPreview));
        OnPropertyChanged(nameof(WindowAfternoonInPreview));
    }

    private static string ExtractMessage(Exception ex) =>
        ex is ApiException api ? api.Message : SettingsUiStrings.System.SaveFail;
}
