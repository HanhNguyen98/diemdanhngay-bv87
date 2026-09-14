namespace BV87.Core.Models.Attendance;

public sealed class NghiTrucAssignRequest
{
    public int EmpCode { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string PayrollIntent { get; set; } = string.Empty;
    public string? Note { get; set; }
}
