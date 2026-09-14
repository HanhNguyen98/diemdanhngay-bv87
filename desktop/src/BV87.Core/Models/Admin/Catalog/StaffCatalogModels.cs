namespace BV87.Core.Models.Admin.Catalog;

public sealed class StaffUpsertRequest
{
    public int? EmpCode { get; set; }
    public string Fullname { get; set; } = string.Empty;
    public int DeptCode { get; set; }
    public string? RankName { get; set; }
    public string? PositionName { get; set; }
    public bool Active { get; set; } = true;
    public string? AvatarUrl { get; set; }
    public string? TransferReason { get; set; }
    public bool? RevokeHeadOnTransfer { get; set; }
}

public sealed class StaffAvatarUpdateRequest
{
    public string? AvatarUrl { get; set; }
}

public sealed class StaffTransferRequest
{
    public int DeptCode { get; set; }
    public string TransferReason { get; set; } = string.Empty;
    public bool? RevokeHeadOnTransfer { get; set; }
}

public sealed class StaffDepartmentAssignmentDto
{
    public long Id { get; set; }
    public int? FromDeptCode { get; set; }
    public string? FromDeptCodeFormatted { get; set; }
    public string? FromDeptName { get; set; }
    public string? FromUnitCode { get; set; }
    public int? ToDeptCode { get; set; }
    public string? ToDeptCodeFormatted { get; set; }
    public string? ToDeptName { get; set; }
    public string? ToUnitCode { get; set; }
    public int? DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public string? DeptName { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
    public string? Reason { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? CreatedAt { get; set; }
    public bool Current { get; set; }
    public bool Initial { get; set; }
}
