using BV87.Core.Constants;

namespace BV87.Core.Excel;

/// <summary>Excel registry for staff catalog — mirror excelRegistry.js STAFF_EXCEL.</summary>
public static class StaffExcelRegistry
{
    public static ExcelRegistryConfig Config { get; } = new()
    {
        TemplateFilename = "mau-nhan-vien.xlsx",
        ExportFilename = "nhan-vien.xlsx",
        SheetName = "Nhân viên",
        TemplateHeaders =
        [
            ExcelImportHeaders.Staff.DeptCode,
            ExcelImportHeaders.Staff.Fullname,
            ExcelImportHeaders.Staff.Rank,
            ExcelImportHeaders.Staff.Position,
            ExcelImportHeaders.Staff.Status
        ],
        TemplateSampleRow = ["01", "Nguyễn Văn A", "Thượng tá", "Trưởng ban", CatalogUiStrings.Staff.Active],
        ExportHeaders =
        [
            CatalogUiStrings.Staff.ColCode,
            CatalogUiStrings.Staff.ColDept,
            CatalogUiStrings.Staff.ColName,
            CatalogUiStrings.Staff.ColRank,
            CatalogUiStrings.Staff.ColPosition,
            CatalogUiStrings.Staff.ColStatus
        ]
    };
}
