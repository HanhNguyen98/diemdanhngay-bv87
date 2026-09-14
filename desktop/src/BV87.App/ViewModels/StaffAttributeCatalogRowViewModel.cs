using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.ViewModels;

public sealed class StaffAttributeCatalogRowViewModel
{
    public int Code { get; init; }
    public string CodeFormatted { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public int SortOrder { get; init; }
    public long UsageCount { get; init; }
    public bool Active { get; init; }
    public int RowNumber { get; set; }

    public bool CanDelete => UsageCount == 0;

    public string StatusLabel => Active ? Core.Constants.CatalogUiStrings.Active : Core.Constants.CatalogUiStrings.Inactive;

    public static StaffAttributeCatalogRowViewModel FromRank(StaffRankDto dto) => new()
    {
        Code = dto.RankCode,
        CodeFormatted = dto.RankCodeFormatted ?? dto.RankCode.ToString(),
        Name = dto.RankName ?? string.Empty,
        SortOrder = dto.SortOrder,
        UsageCount = dto.UsageCount,
        Active = dto.Active
    };

    public static StaffAttributeCatalogRowViewModel FromPosition(StaffPositionDto dto) => new()
    {
        Code = dto.PositionCode,
        CodeFormatted = dto.PositionCodeFormatted ?? dto.PositionCode.ToString(),
        Name = dto.PositionName ?? string.Empty,
        SortOrder = dto.SortOrder,
        UsageCount = dto.UsageCount,
        Active = dto.Active
    };
}
