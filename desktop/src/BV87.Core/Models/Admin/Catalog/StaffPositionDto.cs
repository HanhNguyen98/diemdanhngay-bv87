namespace BV87.Core.Models.Admin.Catalog;

public sealed class StaffPositionDto
{
    public int PositionCode { get; set; }
    public string? PositionCodeFormatted { get; set; }
    public string? PositionName { get; set; }
    public int SortOrder { get; set; }
    public bool Active { get; set; }
    public long UsageCount { get; set; }
}

public sealed class StaffPositionUpsertRequest
{
    public string PositionName { get; set; } = string.Empty;
    public int? SortOrder { get; set; }
    public bool Active { get; set; } = true;
}
