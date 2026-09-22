using System.Collections.ObjectModel;
using System.Windows.Input;
using BV87.App.Helpers;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels.Settings;

public sealed class PermissionGroupsViewModel : ViewModelBase
{
    private readonly AdminApiClient _adminApi;
    private List<PermissionGroupRowViewModel> _all = [];
    private string _roleFilterDraft = string.Empty;
    private string _roleFilter = string.Empty;
    private bool _isLoading;
    private bool _isRefreshing;
    private string? _errorMessage;

    public PermissionGroupsViewModel(AdminApiClient adminApi)
    {
        _adminApi = adminApi;
        Items = new ObservableCollection<PermissionGroupRowViewModel>();

        RefreshCommand = new RelayCommand(async () => await LoadAsync(force: true));
        ApplyFiltersCommand = new RelayCommand(ApplyFilters);
        ResetFiltersCommand = new RelayCommand(ResetFilters);
        AddCommand = new RelayCommand(() => FormRequested?.Invoke(this, null));
        EditCommand = new RelayCommand<PermissionGroupRowViewModel>(
            row =>
            {
                if (row != null)
                {
                    FormRequested?.Invoke(this, row);
                }
            },
            row => row != null);
        DeactivateCommand = new RelayCommand<PermissionGroupRowViewModel>(
            row =>
            {
                if (row != null)
                {
                    DeactivateRequested?.Invoke(this, row);
                }
            },
            row => row is { Active: true });

        _ = LoadAsync(force: false);
    }

    public ObservableCollection<PermissionGroupRowViewModel> Items { get; }

    public IReadOnlyList<AccountFilterOption> RoleFilterOptions { get; } =
    [
        new AccountFilterOption(string.Empty, SettingsUiStrings.PermissionGroups.RoleAll),
        new AccountFilterOption("ADMIN", SettingsUiStrings.Accounts.RoleAdmin),
        new AccountFilterOption("DUTY", SettingsUiStrings.Accounts.RoleDuty),
        new AccountFilterOption("HEAD", SettingsUiStrings.Accounts.RoleHead)
    ];

    public string PageTitle => SettingsUiStrings.PermissionGroups.PageTitle;
    public string NewButtonLabel => SettingsUiStrings.PermissionGroups.NewButton;
    public string RoleFilterLabel => SettingsUiStrings.PermissionGroups.RoleFilterLabel;
    public string UnitLabel => SettingsUiStrings.PermissionGroups.UnitLabel;
    public string StatsTotalLabel => SettingsUiStrings.PermissionGroups.Stats.Total;
    public string StatsActiveLabel => SettingsUiStrings.PermissionGroups.Stats.Active;
    public string StatsInactiveLabel => SettingsUiStrings.PermissionGroups.Stats.Inactive;

    public long StatsTotal => _all.Count;
    public long StatsActive => _all.Count(r => r.Active);
    public long StatsInactive => _all.Count(r => !r.Active);

    public string RoleFilterDraft
    {
        get => _roleFilterDraft;
        set => SetProperty(ref _roleFilterDraft, value);
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

    public string? ErrorMessage
    {
        get => _errorMessage;
        private set => SetProperty(ref _errorMessage, value);
    }

    public ICommand RefreshCommand { get; }
    public ICommand ApplyFiltersCommand { get; }
    public ICommand ResetFiltersCommand { get; }
    public ICommand AddCommand { get; }
    public ICommand EditCommand { get; }
    public ICommand DeactivateCommand { get; }

    public event EventHandler<PermissionGroupRowViewModel?>? FormRequested;
    public event EventHandler<PermissionGroupRowViewModel>? DeactivateRequested;

    public Task<List<ScreenCatalogItemDto>> LoadScreenCatalogAsync() =>
        _adminApi.ListScreensAsync();

    public async Task SaveGroupAsync(PermissionGroupUpsertRequest request, long? editId)
    {
        if (editId == null)
        {
            await _adminApi.CreatePermissionGroupAsync(request);
            ShellToast.Success(SettingsUiStrings.PermissionGroups.FlashCreate);
        }
        else
        {
            await _adminApi.UpdatePermissionGroupAsync(editId.Value, request);
            ShellToast.Success(SettingsUiStrings.PermissionGroups.FlashUpdate);
        }

        await LoadAsync(force: true);
    }

    public async Task DeactivateAsync(PermissionGroupRowViewModel row)
    {
        await _adminApi.DeactivatePermissionGroupAsync(row.Id);
        ShellToast.Success(SettingsUiStrings.PermissionGroups.FlashDeactivate);
        await LoadAsync(force: true);
    }

    private void ApplyFilters()
    {
        _roleFilter = RoleFilterDraft;
        ApplyLocalFilter();
    }

    private void ResetFilters()
    {
        RoleFilterDraft = string.Empty;
        _roleFilter = string.Empty;
        ApplyLocalFilter();
    }

    private async Task LoadAsync(bool force)
    {
        if (IsLoading)
        {
            return;
        }

        IsLoading = true;
        IsRefreshing = force;
        ErrorMessage = null;
        try
        {
            var list = await _adminApi.ListPermissionGroupsAsync();
            _all = list.Select(PermissionGroupRowViewModel.FromDto).ToList();
            ApplyLocalFilter();
            OnPropertyChanged(nameof(StatsTotal));
            OnPropertyChanged(nameof(StatsActive));
            OnPropertyChanged(nameof(StatsInactive));
        }
        catch (Exception ex)
        {
            ErrorMessage = string.IsNullOrWhiteSpace(ex.Message)
                ? SettingsUiStrings.PermissionGroups.LoadError
                : ex.Message;
        }
        finally
        {
            IsLoading = false;
            IsRefreshing = false;
        }
    }

    private void ApplyLocalFilter()
    {
        Items.Clear();
        var query = _all.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(_roleFilter))
        {
            query = query.Where(r =>
                string.Equals(r.Dto.RoleScope, _roleFilter, StringComparison.OrdinalIgnoreCase));
        }

        var n = 1;
        foreach (var row in query)
        {
            row.RowNumber = n++;
            Items.Add(row);
        }
    }
}
