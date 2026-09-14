namespace BV87.Core.Models.Admin;

public sealed class BrandingDto
{
    public string? PortalTitle { get; set; }
    public string? LogoUrl { get; set; }
    public string? LoginAvatarUrl { get; set; }
    public string? AttendanceLockTime { get; set; }
    public string? AttendanceOpenTime { get; set; }
    public string? AttendanceReminderTime { get; set; }
    public string? MorningInOfficial { get; set; }
    public string? NoonOutOfficial { get; set; }
    public string? AfternoonInOfficial { get; set; }
    public string? AfternoonOutOfficial { get; set; }
    public string? MorningOpen { get; set; }
    public string? Midpoint1 { get; set; }
    public string? MidpointNoon { get; set; }
    public string? Midpoint2 { get; set; }
    public string? DayClose { get; set; }
    public int? LateGraceMinutes { get; set; }
    public int? EarlyGraceMinutes { get; set; }
}

public sealed class BrandingUpdateRequest
{
    public string PortalTitle { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? LoginAvatarUrl { get; set; }
    public string? AttendanceLockTime { get; set; }
    public string? AttendanceReminderTime { get; set; }
    public string? MorningInOfficial { get; set; }
    public string? NoonOutOfficial { get; set; }
    public string? AfternoonInOfficial { get; set; }
    public string? AfternoonOutOfficial { get; set; }
    public string? MorningOpen { get; set; }
    public string? Midpoint1 { get; set; }
    public string? MidpointNoon { get; set; }
    public string? Midpoint2 { get; set; }
    public string? DayClose { get; set; }
    public int? LateGraceMinutes { get; set; }
    public int? EarlyGraceMinutes { get; set; }
}

public sealed class AccountStatsDto
{
    public long Total { get; set; }
    public long Active { get; set; }
    public long Inactive { get; set; }
}

public sealed class AdminAccountDto
{
    public long Id { get; set; }
    public string? Username { get; set; }
    public string? Fullname { get; set; }
    public string? Role { get; set; }
    public string? RoleLabel { get; set; }
    public int? DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public string? DeptName { get; set; }
    public string? UnitCode { get; set; }
    public int? EmpCode { get; set; }
    public string? EmpCodeFormatted { get; set; }
    public bool Active { get; set; }
}

public sealed class AccountUpsertRequest
{
    public string Username { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string Fullname { get; set; } = string.Empty;
    public string Role { get; set; } = "HEAD";
    public int? DeptCode { get; set; }
    public int? EmpCode { get; set; }
    public bool? Active { get; set; }
}

public sealed class ResetPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public sealed class KioskTokenDto
{
    public long Id { get; set; }
    public int DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public string? DeptName { get; set; }
    public string? UnitCode { get; set; }
    public string? Label { get; set; }
    public String? Token { get; set; }
    public bool Active { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? LastHeartbeatAt { get; set; }
    public bool AgentOnline { get; set; }
}

public sealed class KioskTokenIssuedDto
{
    public KioskTokenDto? TokenInfo { get; set; }
    public string? Token { get; set; }
}

public sealed class KioskTokenCreateRequest
{
    public int DeptCode { get; set; }
    public string? Label { get; set; }
}

public sealed class KioskTokenUpdateLabelRequest
{
    public string Label { get; set; } = string.Empty;
}
