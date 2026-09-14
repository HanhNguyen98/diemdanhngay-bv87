namespace BV87.Core.Models.Attendance;

/// <summary>One fingerprint scan log row for Admin/HEAD audit modal.</summary>
public sealed class ScanLogItemDto
{
    public DateTimeOffset? ScannedAt { get; set; }
    public string? Direction { get; set; }
    public int? Score { get; set; }
    public string? Message { get; set; }
    public string? ClientHostname { get; set; }
    public string? ClientIp { get; set; }
    public string? KioskLabel { get; set; }
}
