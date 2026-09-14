namespace BV87.Core.Models.Admin;

public sealed class FingerprintTemplateAuditLogPageDto
{
    public List<FingerprintTemplateAuditLogItemDto> Items { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }
    public long TotalItems { get; set; }
    public int TotalPages { get; set; }
}

public sealed class FingerprintTemplateAuditLogItemDto
{
    public long Id { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? Action { get; set; }
    public string? ActionLabel { get; set; }
    public int? EmpCode { get; set; }
    public string? EmpCodeFormatted { get; set; }
    public string? EmpFullname { get; set; }
    public int? DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public string? DeptName { get; set; }
    public string? UnitCode { get; set; }
    public string? ActorUsername { get; set; }
    public string? ActorRole { get; set; }
    public string? KioskLabel { get; set; }
    public string? FingerLabel { get; set; }
    public string? ClientIp { get; set; }
    public string? Note { get; set; }
}

public sealed class FingerprintStatusDto
{
    public int EmpCode { get; set; }
    public string? EmpCodeFormatted { get; set; }
    public string? Fullname { get; set; }
    public int? DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public bool Registered { get; set; }
    public DateTime? EnrolledAt { get; set; }
    public string? EnrolledBy { get; set; }
    public string? FingerLabel { get; set; }
}

public sealed class FingerprintEnrollRequest
{
    public int EmpCode { get; set; }
    public string TemplateBase64 { get; set; } = string.Empty;
    public int TemplateLen { get; set; }
    public int FingerIndex { get; set; }
    public int? ZkFid { get; set; }
    public string FingerLabel { get; set; } = string.Empty;
}
