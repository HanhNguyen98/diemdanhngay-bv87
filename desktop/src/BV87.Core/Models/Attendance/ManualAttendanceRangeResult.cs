namespace BV87.Core.Models.Attendance;

public sealed class ManualAttendanceRangeResult
{
    public int UpdatedCount { get; set; }
    public int SkippedFingerprint { get; set; }
    public int SkippedSoftLock { get; set; }
    public string? Message { get; set; }
    public string? Status { get; set; }
    public string? StatusLabel { get; set; }

    public int SkipCount => SkippedFingerprint + SkippedSoftLock;
}
