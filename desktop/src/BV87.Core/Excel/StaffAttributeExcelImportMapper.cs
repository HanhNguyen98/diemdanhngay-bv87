using BV87.Core.Constants;

namespace BV87.Core.Excel;

public sealed class StaffAttributeImportPayload
{
    public required string Name { get; init; }
    public int? SortOrder { get; init; }
    public bool Active { get; init; }
}

/// <summary>Maps Excel rows to staff rank/position create payloads — mirror mapStaffAttributeCatalogImportRows.</summary>
public static class StaffAttributeExcelImportMapper
{
    public static ExcelImportMapResult<StaffAttributeImportPayload> MapRankRows(
        IReadOnlyList<IReadOnlyDictionary<string, string>> rows) =>
        MapRows(rows, CatalogUiStrings.Ranks.FormName, CatalogUiStrings.Ranks.FormSortOrder, CatalogUiStrings.Ranks.FormActive);

    public static ExcelImportMapResult<StaffAttributeImportPayload> MapPositionRows(
        IReadOnlyList<IReadOnlyDictionary<string, string>> rows) =>
        MapRows(rows, CatalogUiStrings.Positions.FormName, CatalogUiStrings.Positions.FormSortOrder, CatalogUiStrings.Positions.FormActive);

    private static ExcelImportMapResult<StaffAttributeImportPayload> MapRows(
        IReadOnlyList<IReadOnlyDictionary<string, string>> rows,
        string nameHeader,
        string sortOrderHeader,
        string activeHeader)
    {
        var payloads = new List<ExcelImportRow<StaffAttributeImportPayload>>();
        var errors = new List<string>();

        for (var index = 0; index < rows.Count; index++)
        {
            var rowNumber = index + 2;
            var row = rows[index];

            try
            {
                if (!row.TryGetValue(nameHeader, out var nameValue))
                {
                    throw new InvalidOperationException($"Dòng {rowNumber}: {nameHeader} là bắt buộc");
                }

                var name = nameValue.Trim();
                if (string.IsNullOrEmpty(name))
                {
                    throw new InvalidOperationException($"Dòng {rowNumber}: {nameHeader} là bắt buộc");
                }

                row.TryGetValue(sortOrderHeader, out var sortOrderValue);
                row.TryGetValue(activeHeader, out var activeValue);

                payloads.Add(new ExcelImportRow<StaffAttributeImportPayload>
                {
                    RowNumber = rowNumber,
                    Payload = new StaffAttributeImportPayload
                    {
                        Name = name,
                        SortOrder = ParseOptionalSortOrder(sortOrderValue, rowNumber, sortOrderHeader),
                        Active = ExcelActiveStatusParser.Parse(activeValue)
                    }
                });
            }
            catch (Exception ex)
            {
                errors.Add(ex.Message);
            }
        }

        return new ExcelImportMapResult<StaffAttributeImportPayload>
        {
            Payloads = payloads,
            Errors = errors
        };
    }

    private static int? ParseOptionalSortOrder(string? value, int rowNumber, string label)
    {
        var raw = (value ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(raw))
        {
            return null;
        }

        if (!int.TryParse(raw, out var sortOrder) || sortOrder < 0)
        {
            throw new InvalidOperationException($"Dòng {rowNumber}: {label} không hợp lệ");
        }

        return sortOrder;
    }
}
