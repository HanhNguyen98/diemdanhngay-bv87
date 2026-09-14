namespace BV87.Core.Models.Attendance;

public sealed class ManualAttendanceRangeRequest
{
    public int EmpCode { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public string? Note { get; set; }
}
