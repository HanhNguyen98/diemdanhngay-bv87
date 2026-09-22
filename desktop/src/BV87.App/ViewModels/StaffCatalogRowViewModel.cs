using BV87.Core.Helpers;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.ViewModels;

public sealed class StaffCatalogRowViewModel
{
    public int EmpCode { get; init; }
    public string EmpCodeFormatted { get; init; } = string.Empty;
    public string Fullname { get; init; } = string.Empty;
    public int? DeptCode { get; init; }
    public string DeptCodeFormatted { get; init; } = string.Empty;
    public string DeptName { get; init; } = string.Empty;
    public string UnitCode { get; init; } = string.Empty;
    public string RankName { get; init; } = string.Empty;
    public string PositionName { get; init; } = string.Empty;
    public bool Active { get; init; }
    public string? AvatarUrl { get; init; }
    public string Initials => StaffInitialsHelper.FromFullname(Fullname);
    public bool HasActiveHeadAccount { get; init; }
    public bool IsDepartmentCatalogHead { get; init; }
    public string? HeadAccountUsername { get; init; }
    public bool FingerprintRegistered { get; init; }
    public string? FingerLabel { get; init; }
    public int RowNumber { get; set; }

    public string DeptDisplay => DeptDisplayFormatter.Format(UnitCode, DeptName, DeptCodeFormatted);

    public string RankDisplay => string.IsNullOrWhiteSpace(RankName) ? "—" : RankName;

    public string PositionDisplay => string.IsNullOrWhiteSpace(PositionName) ? "—" : PositionName;

    public string StatusLabel => Active ? Core.Constants.CatalogUiStrings.Staff.Active : Core.Constants.CatalogUiStrings.Staff.Inactive;

    public string FingerprintLabel => FingerprintRegistered
        ? Core.Constants.CatalogUiStrings.Staff.FingerprintLabel(FingerLabel)
        : Core.Constants.CatalogUiStrings.Staff.FingerprintMissing;

    public bool RequiresHeadRevoke => HasActiveHeadAccount || IsDepartmentCatalogHead;

    public static StaffCatalogRowViewModel FromDto(AdminStaffDto dto) => new()
    {
        EmpCode = dto.EmpCode,
        EmpCodeFormatted = dto.EmpCodeFormatted ?? dto.EmpCode.ToString("D5"),
        Fullname = dto.Fullname ?? string.Empty,
        DeptCode = dto.DeptCode,
        DeptCodeFormatted = dto.DeptCodeFormatted ?? dto.DeptCode?.ToString("D2") ?? string.Empty,
        DeptName = dto.DeptName ?? string.Empty,
        UnitCode = dto.UnitCode ?? string.Empty,
        RankName = dto.RankName ?? string.Empty,
        PositionName = dto.PositionName ?? string.Empty,
        Active = dto.Active,
        AvatarUrl = dto.AvatarUrl,
        HasActiveHeadAccount = dto.HasActiveHeadAccount,
        IsDepartmentCatalogHead = dto.IsDepartmentCatalogHead,
        HeadAccountUsername = dto.HeadAccountUsername,
        FingerprintRegistered = dto.FingerprintRegistered,
        FingerLabel = dto.FingerLabel
    };
}

public sealed class StaffDeptFilterOption
{
    public StaffDeptFilterOption(int? deptCode, string label)
    {
        DeptCode = deptCode;
        Label = label;
    }

    public int? DeptCode { get; }
    public string Label { get; }
}

public sealed class StaffActiveFilterOption
{
    public StaffActiveFilterOption(bool? active, string label)
    {
        Active = active;
        Label = label;
    }

    public bool? Active { get; }
    public string Label { get; }
}
