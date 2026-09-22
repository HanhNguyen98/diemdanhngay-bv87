using System.Globalization;
using System.Windows;
using BV87.App.Helpers;
using BV87.App.Shell;
using BV87.App.ViewModels;
using BV87.Core.Constants;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.Views.Admin.Catalog;

public partial class DepartmentGroupFormDialog : AppDialogWindow
{
    private readonly DepartmentCatalogViewModel _viewModel;
    private readonly DepartmentGroupRowViewModel? _initial;
    private readonly bool _isEdit;

    public DepartmentGroupFormDialog(
        DepartmentCatalogViewModel viewModel,
        DepartmentGroupRowViewModel? initial)
    {
        InitializeComponent();
        _viewModel = viewModel;
        _initial = initial;
        _isEdit = initial != null;

        Title = _isEdit
            ? CatalogUiStrings.DepartmentGroups.FormTitleEdit
            : CatalogUiStrings.DepartmentGroups.FormTitleCreate;
        UpdateContextHeader();

        if (_isEdit && initial != null)
        {
            CodeBox.Text = initial.GroupCodeFormatted;
            GroupNameBox.Text = initial.GroupName;
            SortOrderBox.Text = initial.SortOrder.ToString(CultureInfo.InvariantCulture);
        }
        else
        {
            CodeBox.Text = CatalogUiStrings.LoadingCode;
            _ = LoadNextCodeAsync();
        }

        Loaded += (_, _) => GroupNameBox.Focus();
    }

    private void UpdateContextHeader()
    {
        if (!_isEdit || _initial == null)
        {
            DialogContextHeaderHelper.SetBadge(ContextHeader, CatalogUiStrings.DepartmentGroups.FormHeaderBadgeCreate);
            return;
        }

        DialogContextHeaderHelper.SetPerson(ContextHeader, _initial.GroupName, _initial.GroupCodeFormatted);
    }

    private async Task LoadNextCodeAsync()
    {
        try
        {
            var next = await App.AdminApi.GetNextGroupCodeAsync();
            CodeBox.Text = next.CodeFormatted ?? next.Code.ToString();
        }
        catch (Exception ex)
        {
            CodeBox.Text = "—";
            ShowError(ex.Message.Trim('"', ' '));
        }
    }

    private async void Save_Click(object sender, RoutedEventArgs e)
    {
        HideError();

        var groupName = GroupNameBox.Text.Trim();
        if (string.IsNullOrWhiteSpace(groupName))
        {
            ShowError(CatalogUiStrings.DepartmentGroups.GroupNameRequired);
            return;
        }

        int? sortOrder = null;
        if (!string.IsNullOrWhiteSpace(SortOrderBox.Text))
        {
            if (!int.TryParse(SortOrderBox.Text.Trim(), out var parsed) || parsed < 0)
            {
                ShowError("Thứ tự sắp xếp phải là số không âm");
                return;
            }

            sortOrder = parsed;
        }

        var request = new DepartmentGroupUpsertRequest
        {
            GroupName = groupName,
            SortOrder = sortOrder
        };

        SaveButton.IsEnabled = false;

        try
        {
            await _viewModel.SaveGroupAsync(request, _isEdit ? _initial?.GroupCode : null);
            DialogResult = true;
            Close();
        }
        catch (Exception ex)
        {
            ShowError(ex.Message.Trim('"', ' '));
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

    private void HideError()
    {
        ErrorText.Visibility = Visibility.Collapsed;
    }
}
