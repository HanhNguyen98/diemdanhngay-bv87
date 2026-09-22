using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.App.ViewModels;
using BV87.Core;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels.Settings;

public sealed class ChangePasswordViewModel : ViewModelBase
{
    private readonly Bv87ApiClient _api;
    private readonly AdminApiClient? _adminApi;
    private readonly string _pageTitle;
    private List<AccountRowViewModel> _allAccounts = [];
    private bool _isSaving;
    private bool _isSearchingAccounts;
    private bool _isResettingUserPassword;
    private string? _statusMessage;
    private string? _errorMessage;
    private string? _adminStatusMessage;
    private string? _adminErrorMessage;
    private string _accountSearchDraft = string.Empty;
    private int? _deptFilter;
    private AccountRowViewModel? _selectedAccount;

    public ChangePasswordViewModel(Bv87ApiClient api, AdminApiClient? adminApi, bool isAdmin, string? headDeptName = null)
    {
        _api = api;
        _adminApi = adminApi;
        IsAdmin = isAdmin;
        _pageTitle = isAdmin
            ? SettingsUiStrings.ChangePassword.PageTitle
            : HeadPageTitleFormatter.Format(SettingsUiStrings.ChangePassword.PageTitle, headDeptName);
        AccountOptions = new ObservableCollection<AccountRowViewModel>();
        DeptFilterOptions = new ObservableCollection<DeptFilterOption>();

        SubmitCommand = new RelayCommand(() => { }, () => !IsSaving);
        AdminResetCommand = new RelayCommand(() => { }, () => !IsResettingUserPassword);

        if (IsAdmin)
        {
            _ = LoadResetDirectoryAsync();
        }
    }

    public bool IsAdmin { get; }

    public bool ShowAdminReset => IsAdmin;

    public GridLength AdminGapWidth => ShowAdminReset ? new GridLength(16) : new GridLength(0);

    public GridLength AdminColumnWidth => ShowAdminReset ? new GridLength(1, GridUnitType.Star) : new GridLength(0);

    public double SelfCardWidth => ShowAdminReset ? double.NaN : 560d;

    public double SelfCardMinWidth => ShowAdminReset ? 320d : 560d;

    public double SelfCardMaxWidth => ShowAdminReset ? 10000d : 560d;

    public HorizontalAlignment SelfCardHorizontalAlignment =>
        ShowAdminReset ? HorizontalAlignment.Stretch : HorizontalAlignment.Left;

    public ObservableCollection<AccountRowViewModel> AccountOptions { get; }

    public ObservableCollection<DeptFilterOption> DeptFilterOptions { get; }

    public ICommand SubmitCommand { get; }

    public ICommand AdminResetCommand { get; }

    public string PageTitle => _pageTitle;
    public string PageSubtitle => IsAdmin
        ? SettingsUiStrings.ChangePassword.PageSubtitle
        : SettingsUiStrings.ChangePassword.HeadPageSubtitle;
    public string NewPasswordLabel => SettingsUiStrings.ChangePassword.NewPassword;
    public string ConfirmPasswordLabel => SettingsUiStrings.ChangePassword.ConfirmPassword;
    public string SubmitLabel => IsSaving ? SettingsUiStrings.ChangePassword.Saving : SettingsUiStrings.ChangePassword.Submit;
    public string AdminResetSubmitLabel =>
        IsResettingUserPassword ? SettingsUiStrings.ChangePassword.AdminResetSaving : SettingsUiStrings.ChangePassword.AdminResetSubmit;

    public string AccountSearchDraft
    {
        get => _accountSearchDraft;
        set
        {
            if (SetProperty(ref _accountSearchDraft, value))
            {
                ApplyAccountFilter();
            }
        }
    }

    public int? DeptFilter
    {
        get => _deptFilter;
        set
        {
            if (SetProperty(ref _deptFilter, value))
            {
                ApplyAccountFilter();
            }
        }
    }

    public AccountRowViewModel? SelectedAccount
    {
        get => _selectedAccount;
        set => SetProperty(ref _selectedAccount, value);
    }

    public bool IsSaving
    {
        get => _isSaving;
        private set
        {
            if (SetProperty(ref _isSaving, value))
            {
                OnPropertyChanged(nameof(SubmitLabel));
            }
        }
    }

    public bool IsSearchingAccounts
    {
        get => _isSearchingAccounts;
        private set => SetProperty(ref _isSearchingAccounts, value);
    }

    public bool IsResettingUserPassword
    {
        get => _isResettingUserPassword;
        private set
        {
            if (SetProperty(ref _isResettingUserPassword, value))
            {
                OnPropertyChanged(nameof(AdminResetSubmitLabel));
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

    public string? AdminStatusMessage
    {
        get => _adminStatusMessage;
        private set => SetProperty(ref _adminStatusMessage, value);
    }

    public string? AdminErrorMessage
    {
        get => _adminErrorMessage;
        private set => SetProperty(ref _adminErrorMessage, value);
    }

    /// <summary>Updates the signed-in account password. Current password is not required.</summary>
    public async Task<bool> SubmitAsync(string newPassword, string confirmPassword)
    {
        ErrorMessage = null;
        StatusMessage = null;

        if (newPassword != confirmPassword)
        {
            ErrorMessage = SettingsUiStrings.ChangePassword.Mismatch;
            return false;
        }

        if (newPassword.Length < 6)
        {
            ErrorMessage = SettingsUiStrings.ChangePassword.MinLength;
            return false;
        }

        IsSaving = true;
        try
        {
            await _api.ChangePasswordAsync(new ChangePasswordRequest
            {
                CurrentPassword = null,
                NewPassword = newPassword,
                ConfirmPassword = confirmPassword
            });
            ShellToast.Success(ToastCopy.OkItem("đổi", "mật khẩu"));
            return true;
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.FailItem("đổi", "mật khẩu"));
            return false;
        }
        finally
        {
            IsSaving = false;
        }
    }

    public async Task LoadResetDirectoryAsync()
    {
        if (!IsAdmin || _adminApi == null)
        {
            return;
        }

        AdminErrorMessage = null;
        IsSearchingAccounts = true;
        try
        {
            var departmentsTask = _adminApi.ListDepartmentsAsync();
            var accountsTask = _adminApi.ListAccountsPageAsync(page: 1, pageSize: 500);
            await Task.WhenAll(departmentsTask, accountsTask);

            _allAccounts = (accountsTask.Result.Items ?? [])
                .Select(AccountRowViewModel.FromDto)
                .ToList();

            DeptFilterOptions.Clear();
            DeptFilterOptions.Add(new DeptFilterOption(null, AdminUiStrings.DeptFilterAll));
            foreach (var dept in departmentsTask.Result.OrderBy(d => d.DeptCode))
            {
                DeptFilterOptions.Add(new DeptFilterOption(dept.DeptCode, dept.DisplayLabel));
            }

            ApplyAccountFilter();
        }
        catch (Exception ex)
        {
            AdminErrorMessage = ExtractMessage(ex);
        }
        finally
        {
            IsSearchingAccounts = false;
        }
    }

    public async Task<bool> ResetUserPasswordAsync(string newPassword, string confirmPassword)
    {
        if (!IsAdmin || _adminApi == null)
        {
            return false;
        }

        AdminErrorMessage = null;
        AdminStatusMessage = null;

        if (SelectedAccount == null)
        {
            AdminErrorMessage = SettingsUiStrings.ChangePassword.AdminResetUserRequired;
            return false;
        }

        if (newPassword.Length < 6)
        {
            AdminErrorMessage = SettingsUiStrings.Accounts.ResetPasswordMinLength;
            return false;
        }

        if (newPassword != confirmPassword)
        {
            AdminErrorMessage = SettingsUiStrings.Accounts.ResetPasswordMismatch;
            return false;
        }

        IsResettingUserPassword = true;
        try
        {
            await _adminApi.ResetAccountPasswordAsync(SelectedAccount.Id, new ResetPasswordRequest
            {
                NewPassword = newPassword,
                ConfirmPassword = confirmPassword
            });
            ShellToast.Success(ToastCopy.Ok("đặt lại", "mật khẩu", ToastCopy.Account(SelectedAccount.Username)));
            return true;
        }
        catch (Exception)
        {
            ShellToast.Danger(ToastCopy.Fail("đặt lại", "mật khẩu", ToastCopy.Account(SelectedAccount.Username)));
            return false;
        }
        finally
        {
            IsResettingUserPassword = false;
        }
    }

    private void ApplyAccountFilter()
    {
        var selectedId = SelectedAccount?.Id;
        var search = AccountSearchDraft.Trim();

        IEnumerable<AccountRowViewModel> query = _allAccounts;
        if (DeptFilter is int deptCode)
        {
            query = query.Where(item => item.Dto.DeptCode == deptCode);
        }

        if (search.Length > 0)
        {
            query = query.Where(item => MatchesSearch(item, search));
        }

        var list = query
            .OrderBy(item => item.Fullname, StringComparer.CurrentCultureIgnoreCase)
            .ThenBy(item => item.Username, StringComparer.OrdinalIgnoreCase)
            .ToList();

        AccountOptions.Clear();
        foreach (var item in list)
        {
            AccountOptions.Add(item);
        }

        SelectedAccount = list.FirstOrDefault(item => item.Id == selectedId) ?? list.FirstOrDefault();
        AdminErrorMessage = list.Count == 0 ? SettingsUiStrings.ChangePassword.AdminResetNoResults : null;
    }

    private static bool MatchesSearch(AccountRowViewModel item, string search)
    {
        return Contains(item.Fullname, search)
            || Contains(item.Username, search)
            || Contains(item.EmpCodeDisplay, search)
            || Contains(item.Dto.DeptName, search);
    }

    private static bool Contains(string? value, string search) =>
        !string.IsNullOrWhiteSpace(value)
        && value.Contains(search, StringComparison.CurrentCultureIgnoreCase);

    private static string ExtractMessage(Exception ex) =>
        ex is ApiException api ? api.Message : "Đã xảy ra lỗi. Vui lòng thử lại.";
}
