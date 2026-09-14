namespace BV87.Core.Models.Attendance;

public sealed class AttendancePageResponse
{
    public AttendanceSummary? Summary { get; set; }
    public List<StaffAttendanceRow> Staff { get; set; } = [];
}
