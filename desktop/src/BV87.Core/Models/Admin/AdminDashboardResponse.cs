using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Attendance;

namespace BV87.Core.Models.Admin;

public sealed class AdminDashboardResponse
{
    public DateOnly? AttendanceDate { get; set; }
    public AdminDashboardKpi? Kpi { get; set; }
    public List<DeptProgressSummary> Departments { get; set; } = [];
}

public sealed class AdminDashboardKpi
{
    public long Total { get; set; }
    public List<StatusBreakdownItem> StatusBreakdown { get; set; } = [];
    public long Unchecked { get; set; }
}

public sealed class DeptProgressSummary
{
    public int? DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public string? DeptName { get; set; }
    public string? DeptNameDisplay { get; set; }
    public string? UnitCode { get; set; }
    public long Total { get; set; }
    public long MarkedCount { get; set; }
    public long UncheckedCount { get; set; }
    public int ProgressPercent { get; set; }
    public string? CompletionStatus { get; set; }
    public bool Locked { get; set; }
    public bool Unlocked { get; set; }
    public bool ManualLocked { get; set; }
    public bool ReportBlocked { get; set; }
    public bool ReportSubmitted { get; set; }
    public bool HasActiveHeadAccount { get; set; }
    public List<StatusBreakdownItem> StatusBreakdown { get; set; } = [];

    public string DisplayName => DeptDisplayFormatter.Format(
        UnitCode,
        string.IsNullOrWhiteSpace(DeptNameDisplay) ? DeptName : DeptNameDisplay,
        DeptCodeFormatted ?? DeptCode?.ToString("D2") ?? "—");
    public bool IsCompleted => string.Equals(CompletionStatus, "COMPLETED", StringComparison.OrdinalIgnoreCase);
    public string ProgressText => $"{MarkedCount}/{Total}";
    public string StatusLabel => IsCompleted ? AdminUiStrings.Completed : AdminUiStrings.Incomplete;
}
