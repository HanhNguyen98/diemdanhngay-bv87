namespace BV87.Core.Models.Attendance;

public sealed class AttendanceSummary
{
    public DateOnly? AttendanceDate { get; set; }
    public int? DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public string? DeptName { get; set; }
    public string? DeptNameDisplay { get; set; }
    public string? UnitCode { get; set; }
    public long Total { get; set; }
    public List<StatusBreakdownItem> StatusBreakdown { get; set; } = [];
    public bool Locked { get; set; }
    public bool Unlocked { get; set; }
    public bool Editable { get; set; }
    public bool IncompleteExplainAllowed { get; set; }
    public string? LockTime { get; set; }
    public string? LockMessage { get; set; }
    public long MarkedCount { get; set; }
    public long UncheckedCount { get; set; }
    public int ProgressPercent { get; set; }
    public bool ReportBlocked { get; set; }
    public bool ManualLocked { get; set; }
    public bool ReportSubmitted { get; set; }
    public long? UnlockRequestId { get; set; }
    public string? UnlockRequestStatus { get; set; }
}
