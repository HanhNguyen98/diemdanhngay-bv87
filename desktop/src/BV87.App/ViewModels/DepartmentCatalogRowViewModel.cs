using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.ViewModels;

public sealed class DepartmentCatalogRowViewModel
{
    public int DeptCode { get; init; }
    public string DeptCodeFormatted { get; init; } = string.Empty;
    public int? GroupCode { get; init; }
    public string GroupName { get; init; } = string.Empty;
    public string UnitCode { get; init; } = string.Empty;
    public string DeptName { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string? HeadName { get; init; }
    public string? HeadRank { get; init; }
    public int? HeadEmpCode { get; init; }
    public string? Location { get; init; }
    public string? LocationImageUrl { get; init; }
    public long StaffCount { get; init; }
    public int RowNumber { get; set; }

    public bool CanDelete => StaffCount == 0;

    public string UnitCodeDisplay => string.IsNullOrWhiteSpace(UnitCode) ? "—" : UnitCode;

    public string GroupNameDisplay => string.IsNullOrWhiteSpace(GroupName) ? "—" : GroupName;

    public string HeadDisplay => string.IsNullOrWhiteSpace(HeadName) ? "—" : HeadName!;

    public static DepartmentCatalogRowViewModel FromDto(AdminDepartmentDto dto) => new()
    {
        DeptCode = dto.DeptCode,
        DeptCodeFormatted = dto.DeptCodeFormatted ?? dto.DeptCode.ToString("D2"),
        GroupCode = dto.GroupCode,
        GroupName = dto.GroupName ?? string.Empty,
        UnitCode = dto.UnitCode ?? string.Empty,
        DeptName = dto.DeptName ?? string.Empty,
        DisplayName = dto.DisplayName,
        HeadName = dto.HeadName,
        HeadRank = dto.HeadRank,
        HeadEmpCode = dto.HeadEmpCode,
        Location = dto.Location,
        LocationImageUrl = dto.LocationImageUrl,
        StaffCount = dto.StaffCount
    };
}

public sealed class DepartmentGroupRowViewModel
{
    public int GroupCode { get; init; }
    public string GroupCodeFormatted { get; init; } = string.Empty;
    public string GroupName { get; init; } = string.Empty;
    public int SortOrder { get; init; }
    public long DeptCount { get; init; }

    public bool CanDelete => DeptCount == 0;

    public static DepartmentGroupRowViewModel FromDto(AdminDepartmentGroupDto dto) => new()
    {
        GroupCode = dto.GroupCode,
        GroupCodeFormatted = dto.GroupCodeFormatted ?? dto.GroupCode.ToString(),
        GroupName = dto.GroupName ?? string.Empty,
        SortOrder = dto.SortOrder,
        DeptCount = dto.DeptCount
    };
}

public sealed class DepartmentGroupFilterOption
{
    public DepartmentGroupFilterOption(int? groupCode, string label)
    {
        GroupCode = groupCode;
        Label = label;
    }

    public int? GroupCode { get; }
    public string Label { get; }
}
