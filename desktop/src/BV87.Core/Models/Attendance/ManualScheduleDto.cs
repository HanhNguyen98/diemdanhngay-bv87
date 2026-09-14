namespace BV87.Core.Models.Attendance;

public sealed class ManualScheduleDto
{
    public int EmpCode { get; set; }
    public string? EmpCodeFormatted { get; set; }
    public string? Fullname { get; set; }
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public List<ManualSchedulePeriodDto> Items { get; set; } = [];
}
