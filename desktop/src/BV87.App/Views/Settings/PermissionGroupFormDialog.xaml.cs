using System.Collections.ObjectModel;
using System.Windows;
using BV87.App.Helpers;
using BV87.App.Shell;
using BV87.App.ViewModels.Settings;
using BV87.Core.Constants;
using BV87.Core.Models.Admin;

namespace BV87.App.Views.Settings;

public partial class PermissionGroupFormDialog : AppDialogWindow
{
    private readonly PermissionGroupsViewModel _ownerVm;
    private readonly PermissionGroupRowViewModel? _editRow;
    private readonly ObservableCollection<ScreenPickItem> _items = [];

    public PermissionGroupFormDialog(PermissionGroupsViewModel ownerVm, PermissionGroupRowViewModel? editRow)
    {
        _ownerVm = ownerVm;
        _editRow = editRow;
        InitializeComponent();
        Title = _editRow == null
            ? SettingsUiStrings.PermissionGroups.FormTitleCreate
            : SettingsUiStrings.PermissionGroups.FormTitleEdit;
        DialogContextHeaderHelper.SetBadge(
            ContextHeader,
            _editRow == null
                ? SettingsUiStrings.PermissionGroups.FormBadgeCreate
                : SettingsUiStrings.PermissionGroups.FormBadgeEdit);
        ScreensList.ItemsSource = _items;
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        SaveButton.IsEnabled = false;
        try
        {
            var catalog = await _ownerVm.LoadScreenCatalogAsync();
            var selected = new HashSet<string>(
                _editRow?.Dto.ScreenCodes ?? [],
                StringComparer.OrdinalIgnoreCase);

            if (_editRow != null)
            {
                NameBox.Text = _editRow.Dto.Name ?? string.Empty;
                ActiveCheck.IsChecked = _editRow.Active;
            }
            else
            {
                ActiveCheck.IsChecked = true;
            }

            _items.Clear();
            foreach (var screen in catalog)
            {
                _items.Add(new ScreenPickItem
                {
                    Code = screen.Code,
                    DisplayLabel = screen.DisplayLabel,
                    Group = screen.Group,
                    IsSelected = selected.Contains(screen.Code)
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
            var name = NameBox.Text.Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                ShowError(SettingsUiStrings.PermissionGroups.NameRequired);
                return;
            }

            var codes = _items
                .Where(i => i.IsSelected)
                .Select(i => i.Code)
                .ToList();
            if (codes.Count == 0)
            {
                ShowError(SettingsUiStrings.PermissionGroups.ScreensRequired);
                return;
            }

            var request = new PermissionGroupUpsertRequest
            {
                Name = name,
                ScreenCodes = codes,
                Active = ActiveCheck.IsChecked != false
            };
            await _ownerVm.SaveGroupAsync(request, _editRow?.Id);
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
        public bool IsSelected { get; set; }
    }
}
