using System.Windows;
using System.Windows.Controls;
using BV87.App.Shell;
using BV87.App.ViewModels.Settings;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.Views.Settings;

public partial class AccountFormDialog : AppDialogWindow
{
    private readonly PermissionsViewModel _ownerVm;
    private readonly AccountRowViewModel? _editRow;
    private List<AdminAccountDto> _accounts = [];
    private List<AdminStaffDto> _staffList = [];

    public AccountFormDialog(PermissionsViewModel ownerVm, AccountRowViewModel? editRow)
    {
        _ownerVm = ownerVm;
        _editRow = editRow;
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        TitleText.Text = _editRow == null
            ? SettingsUiStrings.Accounts.FormTitleCreate
            : SettingsUiStrings.Accounts.FormTitleEdit;

        RoleCombo.ItemsSource = new[]
        {
            new RoleOption("HEAD", SettingsUiStrings.Accounts.RoleHead),
            new RoleOption("ADMIN", SettingsUiStrings.Accounts.RoleAdmin)
        };

        try
        {
            var refs = await _ownerVm.LoadFormReferencesAsync();
            _accounts = refs.Accounts;
            _staffList = refs.Staff;
            RefreshStaffCombo();
        }
        catch (Exception ex)
        {
            ShowError(ex.Message);
        }

        if (_editRow != null)
        {
            UsernameBox.Text = _editRow.Dto.Username ?? string.Empty;
            FullnameBox.Text = _editRow.Dto.Fullname ?? string.Empty;
            RoleCombo.SelectedValue = _editRow.Dto.Role ?? "HEAD";
            ActiveCheck.IsChecked = _editRow.Active;
            if (_editRow.Dto.EmpCode != null)
            {
                StaffCombo.SelectedValue = _editRow.Dto.EmpCode;
            }
        }
        else
        {
            RoleCombo.SelectedValue = "HEAD";
            ActiveCheck.IsChecked = true;
        }

        UpdateRolePanels();
    }

    private void RoleCombo_SelectionChanged(object sender, SelectionChangedEventArgs e) => UpdateRolePanels();

    private void StaffCombo_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (StaffCombo.SelectedItem is StaffPickerItem item)
        {
            FullnameBox.Text = item.Staff.Fullname ?? string.Empty;
            DeptDisplayText.Text = item.DeptDisplay;
        }
    }

    private void UpdateRolePanels()
    {
        var role = RoleCombo.SelectedValue as string ?? "HEAD";
        var isHead = role == "HEAD";
        HeadPanel.Visibility = isHead ? Visibility.Visible : Visibility.Collapsed;
        AdminFullnamePanel.Visibility = isHead ? Visibility.Collapsed : Visibility.Visible;
        HeadHintText.Visibility = isHead ? Visibility.Visible : Visibility.Collapsed;
        PasswordHintText.Visibility = _editRow != null ? Visibility.Visible : Visibility.Collapsed;
    }

    private void RefreshStaffCombo()
    {
        var editId = _editRow?.Id;
        var takenDeptCodes = _accounts
            .Where(a => string.Equals(a.Role, "HEAD", StringComparison.OrdinalIgnoreCase)
                        && a.DeptCode != null
                        && a.Id != editId)
            .Select(a => a.DeptCode!.Value)
            .ToHashSet();
        var takenEmpCodes = _accounts
            .Where(a => a.Active && a.EmpCode != null && a.Id != editId)
            .Select(a => a.EmpCode!.Value)
            .ToHashSet();

        var eligible = _staffList
            .Where(s => s.Active)
            .Where(s => (!takenEmpCodes.Contains(s.EmpCode) || s.EmpCode == _editRow?.Dto.EmpCode)
                        && (!takenDeptCodes.Contains(s.DeptCode ?? -1) || s.DeptCode == _editRow?.Dto.DeptCode))
            .Select(StaffPickerItem.FromStaff)
            .ToList();

        if (_editRow?.Dto.EmpCode != null && eligible.All(x => x.Staff.EmpCode != _editRow.Dto.EmpCode))
        {
            var legacy = _staffList.FirstOrDefault(s => s.EmpCode == _editRow.Dto.EmpCode);
            if (legacy != null)
            {
                eligible.Insert(0, StaffPickerItem.FromStaff(legacy));
            }
        }

        StaffCombo.ItemsSource = eligible;
    }

    private async void Save_Click(object sender, RoutedEventArgs e)
    {
        ErrorText.Visibility = Visibility.Collapsed;
        SaveButton.IsEnabled = false;

        try
        {
            var username = UsernameBox.Text.Trim();
            var role = RoleCombo.SelectedValue as string ?? "HEAD";
            var password = PasswordBox.Password;
            var active = ActiveCheck.IsChecked != false;

            if (string.IsNullOrWhiteSpace(username))
            {
                ShowError(SettingsUiStrings.Accounts.UsernameRequired);
                return;
            }

            if (_editRow == null && string.IsNullOrWhiteSpace(password))
            {
                ShowError(SettingsUiStrings.Accounts.PasswordRequired);
                return;
            }

            var request = new AccountUpsertRequest
            {
                Username = username,
                Role = role,
                Active = active
            };

            if (!string.IsNullOrWhiteSpace(password))
            {
                request.Password = password;
            }

            if (role == "HEAD")
            {
                if (StaffCombo.SelectedItem is not StaffPickerItem staffItem)
                {
                    ShowError(SettingsUiStrings.Accounts.FormEmployeeRequired);
                    return;
                }

                var deptTaken = _accounts.Any(a =>
                    string.Equals(a.Role, "HEAD", StringComparison.OrdinalIgnoreCase)
                    && a.DeptCode == staffItem.Staff.DeptCode
                    && a.Id != _editRow?.Id);
                if (deptTaken)
                {
                    ShowError(SettingsUiStrings.Accounts.FormHeadDeptTaken);
                    return;
                }

                request.EmpCode = staffItem.Staff.EmpCode;
                request.DeptCode = staffItem.Staff.DeptCode;
                request.Fullname = staffItem.Staff.Fullname ?? string.Empty;
            }
            else
            {
                var fullname = FullnameBox.Text.Trim();
                if (string.IsNullOrWhiteSpace(fullname))
                {
                    ShowError(SettingsUiStrings.Accounts.FullnameRequired);
                    return;
                }

                request.Fullname = fullname;
                request.DeptCode = null;
                request.EmpCode = null;
            }

            await _ownerVm.SaveAccountAsync(request, _editRow?.Id);
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

    private sealed class RoleOption(string value, string label)
    {
        public string Value { get; } = value;
        public string Label { get; } = label;
    }

    private sealed class StaffPickerItem
    {
        private StaffPickerItem(AdminStaffDto staff)
        {
            Staff = staff;
            DisplayLabel = BuildLabel(staff);
            DeptDisplay = DeptDisplayFormatter.Format(staff.UnitCode, staff.DeptName);
        }

        public AdminStaffDto Staff { get; }
        public string DisplayLabel { get; }
        public string DeptDisplay { get; }

        public static StaffPickerItem FromStaff(AdminStaffDto staff) => new(staff);

        private static string BuildLabel(AdminStaffDto staff)
        {
            var rank = !string.IsNullOrWhiteSpace(staff.RankName) ? $" — {staff.RankName}" : string.Empty;
            var dept = !string.IsNullOrWhiteSpace(staff.DeptName) || !string.IsNullOrWhiteSpace(staff.UnitCode)
                ? $" — {DeptDisplayFormatter.Format(staff.UnitCode, staff.DeptName)}"
                : string.Empty;
            return $"[{staff.EmpCodeFormatted}] {staff.Fullname}{rank}{dept}";
        }
    }
}
