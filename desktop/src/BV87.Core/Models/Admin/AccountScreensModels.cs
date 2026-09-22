namespace BV87.Core.Models.Admin;

public sealed class ScreenCatalogItemDto
{
    public string Code { get; set; } = string.Empty;
    public string NavId { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string DisplayLabel { get; set; } = string.Empty;
    public string Group { get; set; } = string.Empty;
}

public sealed class AccountScreensDto
{
    public long AccountId { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool UsingDefaults { get; set; }
    public long? PermissionGroupId { get; set; }
    public string? PermissionGroupName { get; set; }
    public List<string> ScreenCodes { get; set; } = [];
    public List<string> AllowedCodes { get; set; } = [];
}

public sealed class AccountScreensUpdateRequest
{
    public List<string> ScreenCodes { get; set; } = [];
}
