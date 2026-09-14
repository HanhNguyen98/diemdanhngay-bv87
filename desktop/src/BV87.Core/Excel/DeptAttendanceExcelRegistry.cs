namespace BV87.Core.Excel;

/// <summary>Excel export for Admin dept attendance roster — mirror useDeptAttendanceDetail.handleExport.</summary>
public static class DeptAttendanceExcelRegistry
{
    public static ExcelRegistryConfig Config { get; } = new()
    {
        SheetName = "Chi tiết Chấm công",
        TemplateFilename = "chi-tiet-diem-danh-mau.xlsx",
        ExportFilename = "chi-tiet-diem-danh.xlsx",
        TemplateHeaders = [],
        TemplateSampleRow = [],
        ExportHeaders =
        [
            "Họ và tên",
            "Mã nhân viên",
            "Cấp bậc",
            "Chức vụ",
            "Vào sáng",
            "Ra trưa",
            "Vào chiều",
            "Ra chiều",
            "Trạng thái",
            "Đi trễ kèm",
            "Máy",
            "Ghi chú"
        ]
    };
}
