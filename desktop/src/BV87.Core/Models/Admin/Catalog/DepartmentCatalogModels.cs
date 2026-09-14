using BV87.Core.Helpers;

namespace BV87.Core.Models.Admin.Catalog;

public sealed class AdminDepartmentDto
{
    public int DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public int? GroupCode { get; set; }
    public string? GroupCodeFormatted { get; set; }
    public string? GroupName { get; set; }
    public string? DeptName { get; set; }
    public string? DeptNameDisplay { get; set; }
    public string? UnitCode { get; set; }
    public string? Location { get; set; }
    public string? LocationImageUrl { get; set; }
    public int? HeadEmpCode { get; set; }
    public string? HeadEmpCodeFormatted { get; set; }
    public string? HeadName { get; set; }
    public string? HeadRank { get; set; }
    public long StaffCount { get; set; }
    public bool Active { get; set; }

    public string DisplayName => !string.IsNullOrWhiteSpace(DeptNameDisplay)
        ? DeptNameDisplay!
        : DeptName ?? DeptCodeFormatted ?? DeptCode.ToString();

    public string DisplayLabel => DeptDisplayFormatter.Format(
        UnitCode,
        string.IsNullOrWhiteSpace(DeptNameDisplay) ? DeptName : DeptNameDisplay,
        DeptCodeFormatted ?? DeptCode.ToString("D2"));
}

public sealed class DepartmentUpsertRequest
{
    public int? DeptCode { get; set; }
    public string DeptName { get; set; } = string.Empty;
    public string? UnitCode { get; set; }
    public int GroupCode { get; set; }
    public string? Location { get; set; }
    public int? HeadEmpCode { get; set; }
    public string? LocationImageUrl { get; set; }
}

public sealed class AdminDepartmentGroupDto
{
    public int GroupCode { get; set; }
    public string? GroupCodeFormatted { get; set; }
    public string? GroupName { get; set; }
    public int SortOrder { get; set; }
    public long DeptCount { get; set; }
    public bool Active { get; set; }
}

public sealed class DepartmentGroupUpsertRequest
{
    public string GroupName { get; set; } = string.Empty;
    public int? SortOrder { get; set; }
}

public sealed class AdminStatsDto
{
    public int TotalDepartments { get; set; }
    public int TotalStaff { get; set; }
    public int ActiveStaff { get; set; }
    public double ActivePercent { get; set; }
    public int NewDepartmentsThisMonth { get; set; }
}

public sealed class AdminStaffDto
{
    public int EmpCode { get; set; }
    public string? EmpCodeFormatted { get; set; }
    public string? Fullname { get; set; }
    public int? DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public string? DeptName { get; set; }
    public string? UnitCode { get; set; }
    public string? RankName { get; set; }
    public string? PositionName { get; set; }
    public bool Active { get; set; }
    public string? AvatarUrl { get; set; }
    public bool HasActiveHeadAccount { get; set; }
    public bool IsDepartmentCatalogHead { get; set; }
    public string? HeadAccountUsername { get; set; }
    public bool FingerprintRegistered { get; set; }
    public string? FingerLabel { get; set; }

    public string DisplayLabel => !string.IsNullOrWhiteSpace(RankName)
        ? $"{Fullname} — {RankName}"
        : Fullname ?? EmpCodeFormatted ?? EmpCode.ToString();
}

public sealed class RegistryPageDto<T>
{
    public List<T> Items { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }
    public long TotalItems { get; set; }
    public int TotalPages { get; set; }
}
