using System.Windows;
using System.Windows.Controls;
using BV87.App.Helpers;
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
    private List<PermissionGroupDto> _groups = [];
    private List<DepartmentListItem> _departments = [];

    public AccountFormDialog(PermissionsViewModel ownerVm, AccountRowViewModel? editRow)
    {
        _ownerVm = ownerVm;
        _editRow = editRow;
        InitializeComponent();
        Title = _editRow == null
            ? SettingsUiStrings.Accounts.FormTitleCreate
            : SettingsUiStrings.Accounts.FormTitleEdit;
        UpdateContextHeader();
        Loaded += OnLoaded;
    }

    private bool IsBootstrapAdminEdit =>
        _editRow != null
        && string.Equals(_editRow.Dto.Username, "admin", StringComparison.OrdinalIgnoreCase);

    private void UpdateContextHeader()
    {
        if (_editRow == null)
        {
            DialogContextHeaderHelper.SetBadge(ContextHeader, SettingsUiStrings.Accounts.FormHeaderBadgeCreate);
            return;
        }

        var name = StaffCombo.SelectedItem is StaffPickerItem staff
            ? staff.Staff.Fullname ?? _editRow.Fullname
            : (!string.IsNullOrWhiteSpace(FullnameBox.Text) ? FullnameBox.Text.Trim() : _editRow.Fullname);
        var dept = DeptCombo.SelectedItem is DeptOption d
            ? d.Label
            : _editRow.DeptDisplay;
        DialogContextHeaderHelper.SetPerson(ContextHeader, name, dept);
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        try
        {
            var refs = await _ownerVm.LoadFormReferencesAsync();
            _accounts = refs.Accounts;
            _staffList = refs.Staff;
            _groups = refs.Groups;
            _departments = refs.Departments;
            RefreshPermissionGroupCombo();
            RefreshDeptCombo();
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
            ActiveCheck.IsChecked = _editRow.Active;
            if (_editRow.Dto.PermissionGroupId != null)
            {
                PermissionGroupCombo.SelectedValue = _editRow.Dto.PermissionGroupId;
            }

            if (_editRow.Dto.DeptCode != null)
            {
                DeptCombo.SelectedValue = _editRow.Dto.DeptCode;
                RefreshStaffCombo();
            }

            if (_editRow.Dto.EmpCode != null)
            {
                StaffCombo.SelectedValue = _editRow.Dto.EmpCode;
            }
        }
        else
        {
            ActiveCheck.IsChecked = true;
        }

        UpdatePanels();
        UpdateContextHeader();
        PasswordHintText.Visibility = _editRow != null ? Visibility.Visible : Visibility.Collapsed;
        if (IsBootstrapAdminEdit)
        {
            UsernameBox.IsReadOnly = true;
        }
    }

    private void PermissionGroupCombo_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        UpdatePanels();
        RefreshStaffCombo();
    }

    private void DeptCombo_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        RefreshStaffCombo();
        UpdateContextHeader();
    }

    private void StaffCombo_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (StaffCombo.SelectedItem is StaffPickerItem item)
        {
            FullnameBox.Text = item.Staff.Fullname ?? string.Empty;
        }

        UpdateContextHeader();
    }

    private string? SelectedShellRole()
    {
        if (PermissionGroupCombo.SelectedItem is GroupOption opt && opt.Id != null)
        {
            return opt.RoleScope;
        }

        if (IsBootstrapAdminEdit && PermissionGroupCombo.SelectedValue == null)
        {
            return "ADMIN";
        }

        return null;
    }

    private void UpdatePanels()
    {
        var showStaff = !IsBootstrapAdminEdit || PermissionGroupCombo.SelectedValue != null;
        // Seed admin with "full quyền" (null group): no dept/staff
        if (IsBootstrapAdminEdit && PermissionGroupCombo.SelectedValue == null)
        {
            showStaff = false;
        }

        // Create / edit non-bootstrap: always dept + staff once group chosen (or always show for create)
        if (!IsBootstrapAdminEdit)
        {
            showStaff = true;
        }

        StaffPanel.Visibility = showStaff ? Visibility.Visible : Visibility.Collapsed;
        BootstrapFullnamePanel.Visibility = (!showStaff && IsBootstrapAdminEdit)
            ? Visibility.Visible
            : Visibility.Collapsed;

        var role = SelectedShellRole();
        RoleHintText.Text = role == "HEAD"
            ? SettingsUiStrings.Accounts.FormHeadDeptNote
            : role == "DUTY"
            ? SettingsUiStrings.Accounts.FormDutyDeptNote
            : SettingsUiStrings.Accounts.FormEmployeeHint;
        PasswordHintText.Visibility = _editRow != null ? Visibility.Visible : Visibility.Collapsed;
    }

    private void RefreshPermissionGroupCombo()
    {
        var options = new List<GroupOption>();
        if (IsBootstrapAdminEdit)
        {
            options.Add(new GroupOption(null, SettingsUiStrings.Accounts.FormPermissionGroupBootstrapAdmin, "ADMIN"));
        }

        options.AddRange(
            _groups
                .Where(g => g.Active)
                .OrderBy(g => g.Name)
                .Select(g => new GroupOption(g.Id, g.Name, g.RoleScope)));

        if (_editRow?.Dto.PermissionGroupId != null
            && options.All(o => o.Id != _editRow.Dto.PermissionGroupId))
        {
            var legacy = _groups.FirstOrDefault(g => g.Id == _editRow.Dto.PermissionGroupId);
            options.Insert(IsBootstrapAdminEdit ? 1 : 0, new GroupOption(
                _editRow.Dto.PermissionGroupId,
                legacy?.Name ?? _editRow.Dto.PermissionGroupName ?? $"#{_editRow.Dto.PermissionGroupId}",
                legacy?.RoleScope ?? _editRow.Dto.Role));
        }

        var previous = PermissionGroupCombo.SelectedValue as long?;
        PermissionGroupCombo.ItemsSource = options;
        if (previous != null && options.Any(o => o.Id == previous))
        {
            PermissionGroupCombo.SelectedValue = previous;
        }
        else if (_editRow?.Dto.PermissionGroupId != null
                 && options.Any(o => o.Id == _editRow.Dto.PermissionGroupId))
        {
            PermissionGroupCombo.SelectedValue = _editRow.Dto.PermissionGroupId;
        }
        else if (IsBootstrapAdminEdit)
        {
            PermissionGroupCombo.SelectedValue = null;
        }
    }

    private void RefreshDeptCombo()
    {
        var options = _departments
            .OrderBy(d => d.DeptCode)
            .Select(d => new DeptOption(d.DeptCode, d.DisplayLabel))
            .ToList();

        var previous = DeptCombo.SelectedValue as int?;
        DeptCombo.ItemsSource = options;
        if (previous != null && options.Any(o => o.DeptCode == previous))
        {
            DeptCombo.SelectedValue = previous;
        }
        else if (_editRow?.Dto.DeptCode != null && options.Any(o => o.DeptCode == _editRow.Dto.DeptCode))
        {
            DeptCombo.SelectedValue = _editRow.Dto.DeptCode;
        }
    }

    private void RefreshStaffCombo()
    {
        var editId = _editRow?.Id;
        var role = SelectedShellRole() ?? "HEAD";
        var deptCode = DeptCombo.SelectedValue as int?;

        var takenEmpCodes = _accounts
            .Where(a => a.Active && a.EmpCode != null && a.Id != editId)
            .Select(a => a.EmpCode!.Value)
            .ToHashSet();
        var takenDeptCodes = role == "HEAD"
            ? _accounts
                .Where(a => string.Equals(a.Role, "HEAD", StringComparison.OrdinalIgnoreCase)
                            && a.DeptCode != null
                            && a.Id != editId)
                .Select(a => a.DeptCode!.Value)
                .ToHashSet()
            : new HashSet<int>();

        IEnumerable<AdminStaffDto> query = _staffList.Where(s => s.Active);
        if (deptCode != null)
        {
            query = query.Where(s => s.DeptCode == deptCode);
        }
        else
        {
            // No department selected → empty staff list
            query = Enumerable.Empty<AdminStaffDto>();
        }

        var eligible = query
            .Where(s => !takenEmpCodes.Contains(s.EmpCode) || s.EmpCode == _editRow?.Dto.EmpCode)
            .Where(s => role != "HEAD"
                        || !takenDeptCodes.Contains(s.DeptCode ?? -1)
                        || s.DeptCode == _editRow?.Dto.DeptCode)
            .Select(StaffPickerItem.FromStaff)
            .ToList();

        if (_editRow?.Dto.EmpCode != null
            && deptCode != null
            && _editRow.Dto.DeptCode == deptCode
            && eligible.All(x => x.Staff.EmpCode != _editRow.Dto.EmpCode))
        {
            var legacy = _staffList.FirstOrDefault(s => s.EmpCode == _editRow.Dto.EmpCode);
            if (legacy != null)
            {
                eligible.Insert(0, StaffPickerItem.FromStaff(legacy));
            }
        }

        var previous = StaffCombo.SelectedValue;
        StaffCombo.ItemsSource = eligible;
        if (previous != null && eligible.Any(x => Equals(x.Staff.EmpCode, previous)))
        {
            StaffCombo.SelectedValue = previous;
        }
        else
        {
            StaffCombo.SelectedIndex = -1;
        }
    }

    private async void Save_Click(object sender, RoutedEventArgs e)
    {
        ErrorText.Visibility = Visibility.Collapsed;
        SaveButton.IsEnabled = false;

        try
        {
            var username = UsernameBox.Text.Trim();
            var password = PasswordBox.Password;
            var active = ActiveCheck.IsChecked != false;
            var groupId = PermissionGroupCombo.SelectedValue as long?;
            var role = SelectedShellRole();
            var needsStaff = !(IsBootstrapAdminEdit && groupId == null);

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

            if (groupId == null && !IsBootstrapAdminEdit)
            {
                ShowError(SettingsUiStrings.Accounts.PermissionGroupRequired);
                return;
            }

            if (string.IsNullOrWhiteSpace(role))
            {
                ShowError(SettingsUiStrings.Accounts.PermissionGroupRequired);
                return;
            }

            var request = new AccountUpsertRequest
            {
                Username = username,
                Active = active,
                PermissionGroupId = groupId,
                Role = role
            };

            if (!string.IsNullOrWhiteSpace(password))
            {
                request.Password = password;
            }

            if (needsStaff)
            {
                if (DeptCombo.SelectedValue is not int)
                {
                    ShowError(SettingsUiStrings.Accounts.FormDeptRequired);
                    return;
                }

                if (StaffCombo.SelectedItem is not StaffPickerItem staffItem)
                {
                    ShowError(SettingsUiStrings.Accounts.FormEmployeeRequired);
                    return;
                }

                if (role == "HEAD")
                {
                    var deptTaken = _accounts.Any(a =>
                        string.Equals(a.Role, "HEAD", StringComparison.OrdinalIgnoreCase)
                        && a.DeptCode == staffItem.Staff.DeptCode
                        && a.Id != _editRow?.Id);
                    if (deptTaken)
                    {
                        ShowError(SettingsUiStrings.Accounts.FormHeadDeptTaken);
                        return;
                    }
                }

                request.EmpCode = staffItem.Staff.EmpCode;
                request.DeptCode = staffItem.Staff.DeptCode;
                request.Fullname = staffItem.Staff.Fullname ?? string.Empty;
            }
            else
            {
                var fullname = FullnameBox.Text.Trim();
                request.Fullname = string.IsNullOrWhiteSpace(fullname) ? "Admin" : fullname;
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

    private sealed class GroupOption(long? id, string label, string? roleScope)
    {
        public long? Id { get; } = id;
        public string Label { get; } = label;
        public string? RoleScope { get; } = roleScope;
    }

    private sealed class DeptOption(int deptCode, string label)
    {
        public int DeptCode { get; } = deptCode;
        public string Label { get; } = label;
    }

    private sealed class StaffPickerItem
    {
        private StaffPickerItem(AdminStaffDto staff)
        {
            Staff = staff;
            var rank = !string.IsNullOrWhiteSpace(staff.RankName) ? $" — {staff.RankName}" : string.Empty;
            DisplayLabel = $"[{staff.EmpCodeFormatted}] {staff.Fullname}{rank}";
        }

        public AdminStaffDto Staff { get; }
        public string DisplayLabel { get; }

        public static StaffPickerItem FromStaff(AdminStaffDto staff) => new(staff);
    }
}
