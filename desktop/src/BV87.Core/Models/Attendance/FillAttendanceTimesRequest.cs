namespace BV87.Core.Models.Attendance;

/// <summary>Admin fills empty 4-phase punch slots only.</summary>
public sealed class FillAttendanceTimesRequest
{
    public int EmpCode { get; set; }
    public DateOnly? Date { get; set; }
    public string? MorningInTime { get; set; }
    public string? NoonOutTime { get; set; }
    public string? AfternoonInTime { get; set; }
    public string? AfternoonOutTime { get; set; }
}
