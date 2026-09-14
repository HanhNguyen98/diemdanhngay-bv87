namespace BV87.Core.Models.Attendance;

public sealed class AttendanceStatisticsResponse
{
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
    public int? DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public string? DeptName { get; set; }
    public AttendanceStatisticsSummary? Summary { get; set; }
}

public sealed class AttendanceStatisticsSummary
{
    public List<StatusBreakdownItem> StatusBreakdown { get; set; } = [];
}

public sealed class AttendanceHistoryItem
{
    public long RecordId { get; set; }
    public DateOnly? AttendanceDate { get; set; }
    public string? AttendanceDateFormatted { get; set; }
    public int EmpCode { get; set; }
    public string? EmpCodeFormatted { get; set; }
    public string Fullname { get; set; } = string.Empty;
    public string? Status { get; set; }
    public string? StatusLabel { get; set; }
    public string? Note { get; set; }
}

public sealed class AttendanceHistoryPageResponse
{
    public List<AttendanceHistoryItem> Items { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }
    public long TotalItems { get; set; }
    public int TotalPages { get; set; }
}
