using System.Windows.Media;
using BV87.App.Helpers;
using BV87.Core.Constants;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.ViewModels;

public sealed class StatusCatalogRowViewModel
{
    public long Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public string BadgeLabel { get; init; } = string.Empty;
    public string ColorKey { get; init; } = "green";
    public string IconKey { get; init; } = "check";
    public int SortOrder { get; init; }
    public long UsageCount { get; init; }
    public bool Active { get; init; }
    public bool ManualAllowed { get; init; }
    public bool GroupParent { get; init; }
    public string? ParentCode { get; init; }
    public int RowNumber { get; set; }

    public bool CanDelete => UsageCount == 0;

    public string StatusLabel => Active ? CatalogUiStrings.Active : CatalogUiStrings.Inactive;

    public SolidColorBrush BadgeColorBrush => StatusCatalogColorHelper.GetBrush(ColorKey);

    public static StatusCatalogRowViewModel FromDto(AttendanceStatusTypeDto dto) => new()
    {
        Id = dto.Id,
        Code = dto.Code ?? string.Empty,
        Label = dto.Label ?? string.Empty,
        BadgeLabel = dto.BadgeLabel ?? string.Empty,
        ColorKey = dto.ColorKey ?? "green",
        IconKey = dto.IconKey ?? "check",
        SortOrder = dto.SortOrder,
        UsageCount = dto.UsageCount,
        Active = dto.Active,
        ManualAllowed = dto.ManualAllowed,
        GroupParent = dto.GroupParent,
        ParentCode = dto.ParentCode
    };
}

public sealed class StatusCatalogParentOption
{
    private StatusCatalogParentOption(string code, string label, string displayText, bool isPlaceholder)
    {
        Code = code;
        Label = label;
        DisplayText = displayText;
        IsPlaceholder = isPlaceholder;
    }

    public string Code { get; }
    public string Label { get; }
    public string DisplayText { get; }
    public bool IsPlaceholder { get; }

    public static StatusCatalogParentOption Placeholder { get; } = new(
        string.Empty,
        string.Empty,
        CatalogUiStrings.StatusCatalog.FormParentCodePlaceholder,
        isPlaceholder: true);

    public static StatusCatalogParentOption FromStatus(string code, string label) =>
        new(code, label, $"{code} - {label}", isPlaceholder: false);
}
