namespace BV87.Core.Models.Attendance;

/// <summary>Admin approves payroll auto-fill for nghi truc.</summary>
public sealed class PayrollFillApproveRequest
{
    public int EmpCode { get; set; }
    public DateOnly? Date { get; set; }
}
