namespace BV87.Core.Models.Attendance;

/// <summary>Admin soft-clear day record to unchecked.</summary>
public sealed class ClearAttendanceRequest
{
    public int EmpCode { get; set; }
    public DateOnly? Date { get; set; }
    public string Reason { get; set; } = string.Empty;
}
