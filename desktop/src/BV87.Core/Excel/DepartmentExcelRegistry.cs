using BV87.Core.Constants;

namespace BV87.Core.Excel;

/// <summary>Excel registry for department catalog — mirror excelRegistry.js DEPARTMENT_EXCEL.</summary>
public static class DepartmentExcelRegistry
{
    public static ExcelRegistryConfig Config { get; } = new()
    {
        TemplateFilename = "mau-phong-ban-khoa.xlsx",
        ExportFilename = "phong-ban-khoa.xlsx",
        SheetName = "Đơn vị",
        TemplateHeaders =
        [
            ExcelImportHeaders.Department.GroupName,
            ExcelImportHeaders.Department.DeptName,
            ExcelImportHeaders.Department.HeadName
        ],
        TemplateSampleRow = ["CƠ QUAN", "Ban Giám đốc", "Nguyễn Văn A"],
        ExportHeaders =
        [
            CatalogUiStrings.Departments.ColGroup,
            CatalogUiStrings.Departments.ColName,
            CatalogUiStrings.Departments.ColHead,
            CatalogUiStrings.Departments.ColStaff
        ]
    };
}
