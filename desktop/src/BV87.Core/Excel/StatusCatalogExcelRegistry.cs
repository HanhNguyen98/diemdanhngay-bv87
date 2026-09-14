using BV87.Core.Constants;

namespace BV87.Core.Excel;

/// <summary>Excel registry for attendance status catalog — mirror excelRegistry.js STATUS_CATALOG_EXCEL.</summary>
public static class StatusCatalogExcelRegistry
{
    public static ExcelRegistryConfig Config { get; } = new()
    {
        TemplateFilename = "mau-trang-thai-lam-viec.xlsx",
        ExportFilename = "trang-thai-lam-viec.xlsx",
        SheetName = "Trạng thái làm việc",
        TemplateHeaders =
        [
            CatalogUiStrings.StatusCatalog.FormCode,
            CatalogUiStrings.StatusCatalog.FormLabel,
            CatalogUiStrings.StatusCatalog.FormBadgeLabel,
            CatalogUiStrings.StatusCatalog.FormColor,
            CatalogUiStrings.StatusCatalog.FormIcon,
            CatalogUiStrings.StatusCatalog.FormSortOrder,
            CatalogUiStrings.StatusCatalog.FormActive
        ],
        TemplateSampleRow =
        [
            "DI_LAM",
            "Đi làm",
            "ĐI LAM",
            "green",
            "check",
            "1",
            CatalogUiStrings.Active
        ],
        ExportHeaders =
        [
            CatalogUiStrings.StatusCatalog.ColCode,
            CatalogUiStrings.StatusCatalog.ColLabel,
            CatalogUiStrings.StatusCatalog.ColBadge,
            CatalogUiStrings.StatusCatalog.ColSort,
            CatalogUiStrings.StatusCatalog.ColUsage,
            CatalogUiStrings.StatusCatalog.ColStatus
        ]
    };
}
