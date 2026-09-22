using System.Globalization;
using System.Windows;
using BV87.App.Helpers;
using BV87.App.Shell;
using BV87.App.ViewModels;
using BV87.Core.Constants;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.Views.Admin.Catalog;

public partial class DepartmentCatalogFormDialog : AppDialogWindow
{
    private readonly DepartmentCatalogViewModel _viewModel;
    private readonly DepartmentCatalogRowViewModel? _initial;
    private readonly bool _isEdit;

    public DepartmentCatalogFormDialog(
        DepartmentCatalogViewModel viewModel,
        DepartmentCatalogRowViewModel? initial)
    {
        InitializeComponent();
        _viewModel = viewModel;
        _initial = initial;
        _isEdit = initial != null;

        Title = _isEdit
            ? CatalogUiStrings.Departments.FormTitleEdit
            : CatalogUiStrings.Departments.FormTitleCreate;
        UpdateContextHeader();

        GroupCombo.ItemsSource = viewModel.ActiveGroups;

        if (_isEdit && initial != null)
        {
            CodeBox.Text = initial.DeptCodeFormatted;
            DeptNameBox.Text = initial.DeptName;
            UnitCodeBox.Text = initial.UnitCode;
            GroupCombo.SelectedValue = initial.GroupCode;
            HeadHintText.Visibility = Visibility.Collapsed;
            _ = LoadHeadOptionsAsync(initial.DeptCode, initial.HeadEmpCode);
        }
        else
        {
            HeadCombo.Visibility = Visibility.Collapsed;
            HeadHintText.Text = CatalogUiStrings.Departments.FormHeadHintCreate;
            HeadHintText.Visibility = Visibility.Visible;
            CodeBox.Text = CatalogUiStrings.LoadingCode;
            if (viewModel.DefaultGroupCodeForForm != null)
            {
                GroupCombo.SelectedValue = viewModel.DefaultGroupCodeForForm;
            }

            _ = LoadNextCodeAsync();
        }

        Loaded += (_, _) => DeptNameBox.Focus();
    }

    private void UpdateContextHeader()
    {
        if (!_isEdit || _initial == null)
        {
            DialogContextHeaderHelper.SetBadge(ContextHeader, CatalogUiStrings.Departments.FormHeaderBadgeCreate);
            return;
        }

        DialogContextHeaderHelper.SetPerson(ContextHeader, _initial.DeptName, _initial.DeptCodeFormatted);
    }

    private async Task LoadNextCodeAsync()
    {
        try
        {
            var next = await App.AdminApi.GetNextDeptCodeAsync();
            CodeBox.Text = next.CodeFormatted ?? next.Code.ToString("D2");
        }
        catch (Exception ex)
        {
            CodeBox.Text = "—";
            ShowError(ex.Message.Trim('"', ' '));
        }
    }

    private async Task LoadHeadOptionsAsync(int deptCode, int? selectedEmpCode)
    {
        try
        {
            var staff = await _viewModel.LoadStaffForDeptAsync(deptCode);
            HeadCombo.ItemsSource = staff;
            HeadCombo.SelectedValue = selectedEmpCode;
        }
        catch (Exception ex)
        {
            ShowError(ex.Message.Trim('"', ' '));
        }
    }

    private async void Save_Click(object sender, RoutedEventArgs e)
    {
        HideError();

        var deptName = DeptNameBox.Text.Trim();
        if (string.IsNullOrWhiteSpace(deptName))
        {
            ShowError(CatalogUiStrings.Departments.DeptNameRequired);
            return;
        }

        if (GroupCombo.SelectedValue is not int groupCode)
        {
            ShowError(CatalogUiStrings.Departments.GroupRequired);
            return;
        }

        int? headEmpCode = null;
        if (_isEdit && HeadCombo.SelectedValue is int empCode)
        {
            headEmpCode = empCode;
        }

        var request = new DepartmentUpsertRequest
        {
            DeptName = deptName,
            UnitCode = string.IsNullOrWhiteSpace(UnitCodeBox.Text) ? null : UnitCodeBox.Text.Trim(),
            GroupCode = groupCode,
            Location = _isEdit ? _initial?.Location : null,
            LocationImageUrl = _isEdit ? _initial?.LocationImageUrl : null,
            HeadEmpCode = headEmpCode
        };

        SaveButton.IsEnabled = false;

        try
        {
            await _viewModel.SaveDepartmentAsync(request, _isEdit ? _initial?.DeptCode : null);
            DialogResult = true;
            Close();
        }
        catch
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

    private void HideError()
    {
        ErrorText.Visibility = Visibility.Collapsed;
    }
}
