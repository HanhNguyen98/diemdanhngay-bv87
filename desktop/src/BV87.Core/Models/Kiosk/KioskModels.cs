namespace BV87.Core.Models.Kiosk;

public sealed class KioskHealthDto
{
    public bool Ok { get; set; }

    public int? DeptCode { get; set; }

    public string? DeptCodeFormatted { get; set; }

    public string? DeptName { get; set; }

    public string? Label { get; set; }

    public string DepartmentDisplay()
    {
        if (!string.IsNullOrWhiteSpace(DeptName))
        {
            return DeptName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(DeptCodeFormatted))
        {
            return DeptCodeFormatted;
        }

        return DeptCode.HasValue ? DeptCode.Value.ToString("D2") : "—";
    }
}

public sealed class KioskTemplateDto
{
    public int EmpCode { get; set; }

    public string? EmpCodeFormatted { get; set; }

    public string? Fullname { get; set; }

    public int? ZkFid { get; set; }

    public string TemplateBase64 { get; set; } = string.Empty;

    public int TemplateLen { get; set; }
}

public sealed class FingerprintScanRequest
{
    public int EmpCode { get; set; }

    public int? Score { get; set; }

    public string? ClientHostname { get; set; }

    public string? ClientIp { get; set; }
}

public sealed class FingerprintScanResultDto
{
    public int EmpCode { get; set; }

    public string? EmpCodeFormatted { get; set; }

    public string? Fullname { get; set; }

    public string? Direction { get; set; }

    public string? Status { get; set; }

    public string? Message { get; set; }

    public int? Score { get; set; }
}

public sealed class KioskHeartbeatResponse
{
    public bool Ok { get; set; }
}
