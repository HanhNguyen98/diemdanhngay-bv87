using BV87.Core.Constants;

namespace BV87.Core.Excel;

public sealed class StatusCatalogImportPayload
{
    public required string Code { get; init; }
    public required string Label { get; init; }
    public required string BadgeLabel { get; init; }
    public required string ColorKey { get; init; }
    public required string IconKey { get; init; }
    public int SortOrder { get; init; }
    public bool Active { get; init; }
    public bool ManualAllowed { get; init; } = true;
    public bool GroupParent { get; init; }
    public string? ParentCode { get; init; }
}

/// <summary>Maps Excel rows to attendance status create payloads — mirror mapStatusCatalogImportRows.</summary>
public static class StatusCatalogExcelImportMapper
{
    private static readonly HashSet<string> AllowedColors = new(StatusCatalogOptions.ColorOptions.Select(o => o.Value), StringComparer.OrdinalIgnoreCase);
    private static readonly HashSet<string> AllowedIcons = new(StatusCatalogOptions.IconOptions.Select(o => o.Value), StringComparer.OrdinalIgnoreCase);

    public static ExcelImportMapResult<StatusCatalogImportPayload> MapRows(
        IReadOnlyList<IReadOnlyDictionary<string, string>> rows)
    {
        var payloads = new List<ExcelImportRow<StatusCatalogImportPayload>>();
        var errors = new List<string>();

        for (var index = 0; index < rows.Count; index++)
        {
            var rowNumber = index + 2;
            var row = rows[index];

            try
            {
                var code = GetRequired(row, CatalogUiStrings.StatusCatalog.FormCode, rowNumber);
                var label = GetRequired(row, CatalogUiStrings.StatusCatalog.FormLabel, rowNumber);
                var badgeLabel = GetOptional(row, CatalogUiStrings.StatusCatalog.FormBadgeLabel) ?? label.ToUpperInvariant();

                row.TryGetValue(CatalogUiStrings.StatusCatalog.FormColor, out var colorRaw);
                var colorKey = (colorRaw ?? string.Empty).Trim().ToLowerInvariant();
                if (string.IsNullOrEmpty(colorKey) || !AllowedColors.Contains(colorKey))
                {
                    throw new InvalidOperationException(
                        $"Dòng {rowNumber}: {CatalogUiStrings.StatusCatalog.FormColor} không hợp lệ \"{colorRaw}\"");
                }

                row.TryGetValue(CatalogUiStrings.StatusCatalog.FormIcon, out var iconRaw);
                var iconKey = (iconRaw ?? string.Empty).Trim().ToLowerInvariant();
                if (string.IsNullOrEmpty(iconKey) || !AllowedIcons.Contains(iconKey))
                {
                    throw new InvalidOperationException(
                        $"Dòng {rowNumber}: {CatalogUiStrings.StatusCatalog.FormIcon} không hợp lệ \"{iconRaw}\"");
                }

                row.TryGetValue(CatalogUiStrings.StatusCatalog.FormSortOrder, out var sortOrderRaw);
                row.TryGetValue(CatalogUiStrings.StatusCatalog.FormActive, out var activeRaw);

                payloads.Add(new ExcelImportRow<StatusCatalogImportPayload>
                {
                    RowNumber = rowNumber,
                    Payload = new StatusCatalogImportPayload
                    {
                        Code = code,
                        Label = label,
                        BadgeLabel = badgeLabel,
                        ColorKey = colorKey,
                        IconKey = iconKey,
                        SortOrder = ParseSortOrder(sortOrderRaw, rowNumber) ?? 0,
                        Active = ExcelActiveStatusParser.Parse(activeRaw),
                        ManualAllowed = true,
                        GroupParent = false,
                        ParentCode = string.Empty
                    }
                });
            }
            catch (Exception ex)
            {
                errors.Add(ex.Message);
            }
        }

        return new ExcelImportMapResult<StatusCatalogImportPayload>
        {
            Payloads = payloads,
            Errors = errors
        };
    }

    private static string GetRequired(IReadOnlyDictionary<string, string> row, string header, int rowNumber)
    {
        if (!row.TryGetValue(header, out var value))
        {
            throw new InvalidOperationException($"Dòng {rowNumber}: {header} là bắt buộc");
        }

        var trimmed = value.Trim();
        if (string.IsNullOrEmpty(trimmed))
        {
            throw new InvalidOperationException($"Dòng {rowNumber}: {header} là bắt buộc");
        }

        return trimmed;
    }

    private static string? GetOptional(IReadOnlyDictionary<string, string> row, string header) =>
        row.TryGetValue(header, out var value) ? value.Trim() : null;

    private static int? ParseSortOrder(string? value, int rowNumber)
    {
        var raw = (value ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(raw))
        {
            return null;
        }

        if (!int.TryParse(raw, out var sortOrder) || sortOrder < 0)
        {
            throw new InvalidOperationException(
                $"Dòng {rowNumber}: {CatalogUiStrings.StatusCatalog.FormSortOrder} không hợp lệ");
        }

        return sortOrder;
    }
}
