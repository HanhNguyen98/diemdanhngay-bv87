namespace BV87.Core.Models.Admin.Catalog;

public sealed class AttendanceStatusTypeDto
{
    public long Id { get; set; }
    public string? Code { get; set; }
    public string? Label { get; set; }
    public string? BadgeLabel { get; set; }
    public string? ColorKey { get; set; }
    public string? IconKey { get; set; }
    public int SortOrder { get; set; }
    public bool Active { get; set; }
    public bool ManualAllowed { get; set; }
    public bool GroupParent { get; set; }
    public string? ParentCode { get; set; }
    public long UsageCount { get; set; }
}

public sealed class AttendanceStatusTypeUpsertRequest
{
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string BadgeLabel { get; set; } = string.Empty;
    public string ColorKey { get; set; } = "green";
    public string IconKey { get; set; } = "check";
    public int SortOrder { get; set; }
    public bool Active { get; set; } = true;
    public bool ManualAllowed { get; set; }
    public bool GroupParent { get; set; }
    public string? ParentCode { get; set; }
}
