using System.Windows;
using System.Windows.Controls;
using BV87.App.Shell;
using BV87.App.ViewModels;
using BV87.Core.Constants;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.Views.Admin.Catalog;

public partial class StaffTransferDialog : AppDialogWindow
{
    private readonly StaffCatalogViewModel _viewModel;
    private readonly StaffCatalogRowViewModel _staff;

    public StaffTransferDialog(StaffCatalogViewModel viewModel, StaffCatalogRowViewModel staff)
    {
        InitializeComponent();
        _viewModel = viewModel;
        _staff = staff;

        Title = CatalogUiStrings.Staff.TransferModalTitle;
        TitleText.Text = Title;
        SubtitleText.Text = CatalogUiStrings.Staff.TransferModalSubtitle(staff.Fullname, staff.EmpCodeFormatted);
        FromDeptText.Text = staff.DeptDisplay;

        var targets = viewModel.ActiveDepartments
            .Where(d => d.DeptCode != staff.DeptCode)
            .Select(d => new DeptComboItem(d.DeptCode, d.DisplayLabel))
            .ToList();
        TargetDeptCombo.ItemsSource = targets;

        if (staff.RequiresHeadRevoke)
        {
            HeadRevokeHint.Text = CatalogUiStrings.Staff.TransferHeadHint(
                staff.DeptDisplay,
                staff.HeadAccountUsername);
            HeadRevokeHint.Visibility = Visibility.Visible;
            RevokeHeadBox.Visibility = Visibility.Visible;
        }
    }

    private async void Save_Click(object sender, RoutedEventArgs e)
    {
        HideError();

        if (TargetDeptCombo.SelectedValue is not int deptCode)
        {
            ShowError(CatalogUiStrings.Staff.DeptRequired);
            return;
        }

        var reason = ReasonBox.Text.Trim();
        if (string.IsNullOrWhiteSpace(reason))
        {
            ShowError(CatalogUiStrings.Staff.TransferReasonRequired);
            return;
        }

        if (_staff.RequiresHeadRevoke && RevokeHeadBox.IsChecked != true)
        {
            ShowError(CatalogUiStrings.Staff.TransferHeadRevokeRequired);
            return;
        }

        var request = new StaffTransferRequest
        {
            DeptCode = deptCode,
            TransferReason = reason,
            RevokeHeadOnTransfer = _staff.RequiresHeadRevoke ? true : null
        };

        SaveButton.IsEnabled = false;

        try
        {
            await _viewModel.TransferStaffAsync(_staff.EmpCode, request, _staff.Fullname);
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

    private sealed class DeptComboItem(int deptCode, string displayLabel)
    {
        public int DeptCode { get; } = deptCode;
        public string DisplayLabel { get; } = displayLabel;
    }
}
