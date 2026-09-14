using BV87.Core.Helpers;

namespace BV87.Core.Models.Admin;

public sealed class DepartmentListItem
{
    public int DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public string? DeptName { get; set; }
    public string? DeptNameDisplay { get; set; }
    public string? UnitCode { get; set; }
    public bool Locked { get; set; }
    public bool Unlocked { get; set; }
    public bool Editable { get; set; }

    public string DisplayLabel => DeptDisplayFormatter.Format(
        UnitCode,
        string.IsNullOrWhiteSpace(DeptNameDisplay) ? DeptName : DeptNameDisplay,
        DeptCodeFormatted ?? DeptCode.ToString("D2"));
}

public sealed class SendReminderResult
{
    public int Sent { get; set; }
    public int SkippedNoHead { get; set; }
    public string? Message { get; set; }
    public List<string> SkippedDeptNames { get; set; } = [];
}

public sealed class ToggleDeptLockResult
{
    public int DeptCode { get; set; }
    public bool Locked { get; set; }
    public bool ManualLocked { get; set; }
    public bool Unlocked { get; set; }
    public string? Message { get; set; }
}

public sealed class ApiMessageResult
{
    public string? Message { get; set; }
}
