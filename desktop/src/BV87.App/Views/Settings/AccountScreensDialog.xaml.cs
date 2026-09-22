using System.Collections.ObjectModel;
using System.Windows;
using BV87.App.Helpers;
using BV87.App.Shell;
using BV87.App.ViewModels.Settings;
using BV87.Core.Constants;
using BV87.Core.Models.Admin;

namespace BV87.App.Views.Settings;

public partial class AccountScreensDialog : AppDialogWindow
{
    private readonly PermissionsViewModel _ownerVm;
    private readonly AccountRowViewModel _row;
    private readonly ObservableCollection<ScreenPickItem> _items = [];

    public AccountScreensDialog(PermissionsViewModel ownerVm, AccountRowViewModel row)
    {
        _ownerVm = ownerVm;
        _row = row;
        InitializeComponent();
        Title = SettingsUiStrings.Accounts.GrantScreensTitle;
        DialogContextHeaderHelper.SetBadgeWithPerson(
            ContextHeader,
            SettingsUiStrings.Accounts.GrantScreensBadge,
            string.IsNullOrWhiteSpace(_row.Dto.Fullname) ? _row.Username : _row.Fullname,
            _row.DeptDisplay);
        ScreensList.ItemsSource = _items;
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        SaveButton.IsEnabled = false;
        try
        {
            var catalog = await _ownerVm.LoadScreenCatalogAsync();
            var current = await _ownerVm.LoadAccountScreensAsync(_row.Id);
            var allowed = new HashSet<string>(current.AllowedCodes ?? [], StringComparer.OrdinalIgnoreCase);
            var selected = new HashSet<string>(current.ScreenCodes ?? [], StringComparer.OrdinalIgnoreCase);
            GroupHintText.Visibility = current.PermissionGroupId != null
                ? Visibility.Visible
                : Visibility.Collapsed;

            _items.Clear();
            foreach (var screen in catalog)
            {
                _items.Add(new ScreenPickItem
                {
                    Code = screen.Code,
                    DisplayLabel = screen.DisplayLabel,
                    Group = screen.Group,
                    IsAllowed = allowed.Contains(screen.Code),
                    IsSelected = selected.Contains(screen.Code) && allowed.Contains(screen.Code)
                });
            }
        }
        catch (Exception ex)
        {
            ShowError(ex.Message);
        }
        finally
        {
            SaveButton.IsEnabled = true;
        }
    }

    private async void Save_Click(object sender, RoutedEventArgs e)
    {
        ErrorText.Visibility = Visibility.Collapsed;
        SaveButton.IsEnabled = false;
        try
        {
            var codes = _items
                .Where(i => i.IsAllowed && i.IsSelected)
                .Select(i => i.Code)
                .ToList();
            await _ownerVm.SaveAccountScreensAsync(_row.Id, codes);
            DialogResult = true;
            Close();
        }
        catch (Exception ex)
        {
            ShowError(ex.Message);
        }
        finally
        {
            SaveButton.IsEnabled = true;
        }
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void ShowError(string message)
    {
        ErrorText.Text = message;
        ErrorText.Visibility = Visibility.Visible;
    }

    private sealed class ScreenPickItem
    {
        public string Code { get; init; } = string.Empty;
        public string DisplayLabel { get; init; } = string.Empty;
        public string Group { get; init; } = string.Empty;
        public bool IsAllowed { get; init; }
        public bool IsSelected { get; set; }
    }
}
