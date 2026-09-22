using System.Windows;
using System.Windows.Controls;
using BV87.App.Helpers;
using BV87.App.Shell;
using BV87.App.ViewModels;
using BV87.Core.Constants;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.Views.Admin.Catalog;

public partial class StaffCatalogFormDialog : AppDialogWindow
{
    private readonly StaffCatalogViewModel _viewModel;
    private readonly StaffCatalogRowViewModel? _initial;
    private readonly bool _isEdit;
    private readonly int? _initialDeptCode;
    private string? _avatarUrl;

    public StaffCatalogFormDialog(
        StaffCatalogViewModel viewModel,
        StaffCatalogRowViewModel? initial)
    {
        InitializeComponent();
        _viewModel = viewModel;
        _initial = initial;
        _isEdit = initial != null;
        _initialDeptCode = initial?.DeptCode;

        var deptItems = viewModel.ActiveDepartments
            .Select(d => new DeptComboItem(d.DeptCode, FormatDeptLabel(d)))
            .ToList();
        DeptCombo.ItemsSource = deptItems;

        RankCombo.ItemsSource = viewModel.RankNames;
        PositionCombo.ItemsSource = viewModel.PositionNames;

        if (_isEdit && initial != null)
        {
            Title = CatalogUiStrings.Staff.FormTitleEdit;
            FullnameBox.Text = initial.Fullname;
            DeptCombo.SelectedValue = initial.DeptCode;
            RankCombo.Text = initial.RankName;
            PositionCombo.Text = initial.PositionName;
            ActiveBox.IsChecked = initial.Active;
            _avatarUrl = initial.AvatarUrl;
            UpdateTransferPanel();
        }
        else
        {
            Title = CatalogUiStrings.Staff.FormTitleCreate;
            ActiveBox.IsChecked = true;
            if (deptItems.Count > 0)
            {
                DeptCombo.SelectedIndex = 0;
            }
        }

        UpdateContextHeader();
        UpdateAvatarStatus();
        Loaded += (_, _) => FullnameBox.Focus();
    }

    private void UpdateContextHeader()
    {
        if (!_isEdit || _initial == null)
        {
            DialogContextHeaderHelper.SetBadge(ContextHeader, CatalogUiStrings.Staff.FormHeaderBadgeCreate);
            return;
        }

        DialogContextHeaderHelper.SetPerson(ContextHeader, _initial.Fullname, GetSelectedDeptDisplay());
    }

    private string GetSelectedDeptDisplay()
    {
        if (DeptCombo.SelectedItem is DeptComboItem item)
        {
            return item.DisplayLabel;
        }

        return _initial?.DeptDisplay ?? string.Empty;
    }

    private static string FormatDeptLabel(AdminDepartmentDto dept) => dept.DisplayLabel;

    private void DeptCombo_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        UpdateTransferPanel();
        if (_isEdit)
        {
            UpdateContextHeader();
        }
    }

    private void UpdateTransferPanel()
    {
        if (!_isEdit || _initial == null)
        {
            TransferPanel.Visibility = Visibility.Collapsed;
            return;
        }

        var selectedDept = DeptCombo.SelectedValue as int?;
        var deptChanged = selectedDept != _initialDeptCode;
        TransferPanel.Visibility = deptChanged ? Visibility.Visible : Visibility.Collapsed;
        Title = deptChanged
            ? CatalogUiStrings.Staff.FormTitleEditTransfer
            : CatalogUiStrings.Staff.FormTitleEdit;

        if (!deptChanged)
        {
            return;
        }

        var requiresRevoke = _initial.RequiresHeadRevoke;
        HeadRevokeHint.Visibility = requiresRevoke ? Visibility.Visible : Visibility.Collapsed;
        RevokeHeadBox.Visibility = requiresRevoke ? Visibility.Visible : Visibility.Collapsed;
        if (requiresRevoke)
        {
            HeadRevokeHint.Text = CatalogUiStrings.Staff.TransferHeadHint(
                _initial.DeptDisplay,
                _initial.HeadAccountUsername);
        }
    }

    private async void Save_Click(object sender, RoutedEventArgs e)
    {
        HideError();

        var fullname = FullnameBox.Text.Trim();
        if (string.IsNullOrWhiteSpace(fullname))
        {
            ShowError(CatalogUiStrings.Staff.FullnameRequired);
            return;
        }

        if (DeptCombo.SelectedValue is not int deptCode)
        {
            ShowError(CatalogUiStrings.Staff.DeptRequired);
            return;
        }

        var deptChanged = _isEdit && deptCode != _initialDeptCode;
        var transferReason = TransferReasonBox.Text.Trim();
        if (deptChanged && string.IsNullOrWhiteSpace(transferReason))
        {
            ShowError(CatalogUiStrings.Staff.TransferReasonRequired);
            return;
        }

        if (deptChanged && _initial?.RequiresHeadRevoke == true && RevokeHeadBox.IsChecked != true)
        {
            ShowError(CatalogUiStrings.Staff.TransferHeadRevokeRequired);
            return;
        }

        var request = new StaffUpsertRequest
        {
            Fullname = fullname,
            DeptCode = deptCode,
            RankName = string.IsNullOrWhiteSpace(RankCombo.Text) ? null : RankCombo.Text.Trim(),
            PositionName = string.IsNullOrWhiteSpace(PositionCombo.Text) ? null : PositionCombo.Text.Trim(),
            Active = ActiveBox.IsChecked != false,
            AvatarUrl = _avatarUrl
        };

        if (deptChanged)
        {
            request.TransferReason = transferReason;
            if (_initial?.RequiresHeadRevoke == true)
            {
                request.RevokeHeadOnTransfer = true;
            }
        }

        SaveButton.IsEnabled = false;

        try
        {
            await _viewModel.SaveStaffAsync(request, _isEdit ? _initial?.EmpCode : null);
            DialogResult = true;
            Close();
        }
        catch
        {
            SaveButton.IsEnabled = true;
        }
    }

    private void Avatar_Click(object sender, RoutedEventArgs e)
    {
        var name = string.IsNullOrWhiteSpace(FullnameBox.Text)
            ? CatalogUiStrings.Staff.FormTitleCreate
            : FullnameBox.Text.Trim();
        var code = _initial?.EmpCodeFormatted ?? "—";
        var dialog = new StaffAvatarDialog(name, code, _avatarUrl, GetSelectedDeptDisplay())
        {
            Owner = this
        };
        if (dialog.ShowDialog() == true)
        {
            _avatarUrl = dialog.AvatarUrl;
            UpdateAvatarStatus();
        }
    }

    private void UpdateAvatarStatus()
    {
        AvatarStatusText.Text = string.IsNullOrWhiteSpace(_avatarUrl)
            ? "Chưa có ảnh"
            : "Đã chọn ảnh";
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

    private sealed class DeptComboItem(int deptCode, string displayLabel)
    {
        public int DeptCode { get; } = deptCode;
        public string DisplayLabel { get; } = displayLabel;
    }
}
