namespace BV87.Core.Models.Admin;

public sealed class UnlockRequestItemDto
{
    public long Id { get; set; }
    public DateOnly? AttendanceDate { get; set; }
    public int? DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public string? DeptName { get; set; }
    public string? UnitCode { get; set; }
    public string? Reason { get; set; }
    public string? Status { get; set; }
    public string? StatusLabel { get; set; }
    public string? RequestedBy { get; set; }
    public DateTime? RequestedAt { get; set; }
    public string? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNote { get; set; }
}

public sealed class UnlockRejectRequest
{
    public string? Note { get; set; }
}

public sealed class UnlockRequestCreateRequest
{
    public DateOnly Date { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public sealed class ReminderHistoryDto
{
    public List<ReminderHistoryItemDto> History { get; set; } = [];
    public List<ReminderDeptStatDto> Stats { get; set; } = [];
}

public sealed class ReminderHistoryItemDto
{
    public long Id { get; set; }
    public DateOnly? AttendanceDate { get; set; }
    public int? DeptCode { get; set; }
    public string? DeptName { get; set; }
    public string? UnitCode { get; set; }
    public string? TriggerType { get; set; }
    public string? Status { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public sealed class ReminderDeptStatDto
{
    public int? DeptCode { get; set; }
    public string? DeptName { get; set; }
    public int SentCount { get; set; }
}

public sealed class AttendanceAuditLogPageDto
{
    public List<AttendanceAuditLogItemDto> Items { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }
    public long TotalItems { get; set; }
    public int TotalPages { get; set; }
}

public sealed class AttendanceAuditLogItemDto
{
    public long Id { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? Username { get; set; }
    public int? DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public string? DeptName { get; set; }
    public string? UnitCode { get; set; }
    public int? EmpCode { get; set; }
    public string? EmpCodeFormatted { get; set; }
    public DateOnly? AttendanceDate { get; set; }
    public string? Action { get; set; }
    public string? ActionLabel { get; set; }
    public string? ClientIp { get; set; }
    public string? UserAgent { get; set; }
}

public sealed class UnlockPendingCountDto
{
    public long Count { get; set; }
}
