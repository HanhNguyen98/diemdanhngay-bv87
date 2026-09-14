using BV87.Core.Constants;

namespace BV87.Core.Excel;

/// <summary>Excel registry for staff rank and position catalogs — mirror excelRegistry.js STAFF_RANK/POSITION_EXCEL.</summary>
public static class StaffAttributeExcelRegistry
{
    public static ExcelRegistryConfig Rank { get; } = new()
    {
        TemplateFilename = "mau-cap-bac.xlsx",
        ExportFilename = "cap-bac.xlsx",
        SheetName = "Cấp bậc",
        TemplateHeaders =
        [
            CatalogUiStrings.Ranks.FormName,
            CatalogUiStrings.Ranks.FormSortOrder,
            CatalogUiStrings.Ranks.FormActive
        ],
        TemplateSampleRow = ["Thượng tá", "6", CatalogUiStrings.Active],
        ExportHeaders =
        [
            CatalogUiStrings.Ranks.ColCode,
            CatalogUiStrings.Ranks.ColName,
            CatalogUiStrings.Ranks.ColSort,
            CatalogUiStrings.Ranks.ColUsage,
            CatalogUiStrings.Ranks.ColStatus
        ]
    };

    public static ExcelRegistryConfig Position { get; } = new()
    {
        TemplateFilename = "mau-chuc-vu.xlsx",
        ExportFilename = "chuc-vu.xlsx",
        SheetName = "Chức vụ",
        TemplateHeaders =
        [
            CatalogUiStrings.Positions.FormName,
            CatalogUiStrings.Positions.FormSortOrder,
            CatalogUiStrings.Positions.FormActive
        ],
        TemplateSampleRow = ["Trưởng ban", "8", CatalogUiStrings.Active],
        ExportHeaders =
        [
            CatalogUiStrings.Positions.ColCode,
            CatalogUiStrings.Positions.ColName,
            CatalogUiStrings.Positions.ColSort,
            CatalogUiStrings.Positions.ColUsage,
            CatalogUiStrings.Positions.ColStatus
        ]
    };
}
