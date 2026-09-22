namespace BV87.Core.Models;

public sealed class UserProfile
{
    public long AccountId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Fullname { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string RoleLabel { get; set; } = string.Empty;
    public int? DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public string? DeptName { get; set; }
    public bool Editable { get; set; }
    public bool Locked { get; set; }
    public string? LockMessage { get; set; }
    public List<string> ScreenCodes { get; set; } = [];

    public bool IsAdmin => string.Equals(Role, "ADMIN", StringComparison.OrdinalIgnoreCase);
    public bool IsDuty => string.Equals(Role, "DUTY", StringComparison.OrdinalIgnoreCase);
    public bool IsHead => string.Equals(Role, "HEAD", StringComparison.OrdinalIgnoreCase);
}
