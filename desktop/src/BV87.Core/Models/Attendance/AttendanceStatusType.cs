namespace BV87.Core.Models.Attendance;

public sealed class AttendanceStatusType
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? BadgeLabel { get; set; }
    public string? ColorKey { get; set; }
    public string? IconKey { get; set; }
    public int SortOrder { get; set; }
    public bool Active { get; set; }
    public bool ManualAllowed { get; set; }
    public bool GroupParent { get; set; }
    public string? ParentCode { get; set; }
}
