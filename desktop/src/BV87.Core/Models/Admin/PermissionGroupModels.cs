namespace BV87.Core.Models.Admin;

public sealed class PermissionGroupDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string RoleScope { get; set; } = string.Empty;
    public string? RoleScopeLabel { get; set; }
    public bool Active { get; set; }
    public List<string> ScreenCodes { get; set; } = [];
    public long AccountCount { get; set; }
}

public sealed class PermissionGroupUpsertRequest
{
    public string Name { get; set; } = string.Empty;
    public string? RoleScope { get; set; }
    public List<string> ScreenCodes { get; set; } = [];
    public bool? Active { get; set; }
}
