namespace BV87.Core.Models.Attendance;

/// <summary>Paginated scan logs for one employee on one calendar day.</summary>
public sealed class ScanLogPageDto
{
    public int? EmpCode { get; set; }
    public string? EmpCodeFormatted { get; set; }
    public string? Fullname { get; set; }
    public DateOnly? Date { get; set; }
    public List<ScanLogItemDto> Items { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }
    public long TotalItems { get; set; }
    public int TotalPages { get; set; }
}
