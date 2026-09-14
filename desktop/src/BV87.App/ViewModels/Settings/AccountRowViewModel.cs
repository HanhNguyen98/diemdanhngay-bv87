using BV87.Core.Helpers;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels.Settings;

public sealed class AccountRowViewModel : IPageRowNumber
{
    private AccountRowViewModel(AdminAccountDto dto)
    {
        Dto = dto;
    }

    public AdminAccountDto Dto { get; }

    public int RowNumber { get; set; }
    public long Id => Dto.Id;
    public string Username => Dto.Username ?? "—";
    public string EmpCodeDisplay => Dto.EmpCodeFormatted ?? "—";
    public string Fullname => Dto.Fullname ?? "—";
    public string RoleLabel => Dto.RoleLabel ?? Dto.Role ?? "—";
    public string DeptDisplay => DeptDisplayFormatter.Format(Dto.UnitCode, Dto.DeptName);
    public bool Active => Dto.Active;
    public string StatusLabel => Active
        ? Core.Constants.SettingsUiStrings.Accounts.Active
        : Core.Constants.SettingsUiStrings.Accounts.Inactive;

    public string DisplayLabel => $"{Username} — {Fullname} ({RoleLabel})";

    public string StaffPickerLabel => $"{Fullname} — {Username}";

    public static AccountRowViewModel FromDto(AdminAccountDto dto) => new(dto);
}

public sealed class AccountFilterOption
{
    public AccountFilterOption(string value, string label)
    {
        Value = value;
        Label = label;
    }

    public string Value { get; }
    public string Label { get; }
}
