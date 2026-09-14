namespace BV87.Core.Models.Attendance;

public sealed class UpdateAttendanceRequest
{
    public int EmpCode { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
}
