namespace BV87.Core.Models.Admin.Catalog;

public sealed class StaffRankDto
{
    public int RankCode { get; set; }
    public string? RankCodeFormatted { get; set; }
    public string? RankName { get; set; }
    public int SortOrder { get; set; }
    public bool Active { get; set; }
    public long UsageCount { get; set; }
}

public sealed class StaffRankUpsertRequest
{
    public string RankName { get; set; } = string.Empty;
    public int? SortOrder { get; set; }
    public bool Active { get; set; } = true;
}
