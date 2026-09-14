namespace BV87.Core.Models.Attendance;

public sealed class ManualSchedulePeriodDto
{
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public int DayCount { get; set; }
    public string? Status { get; set; }
    public string? StatusLabel { get; set; }
}
