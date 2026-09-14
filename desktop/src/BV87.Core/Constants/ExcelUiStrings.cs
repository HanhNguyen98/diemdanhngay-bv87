using BV87.Core.Helpers;

namespace BV87.Core.Constants;

/// <summary>Vietnamese UI strings for Admin Excel actions — mirror frontend ADMIN_UI.excel.</summary>
public static class ExcelUiStrings
{
    public const string MenuLabel = "Tác vụ Excel";
    public const string MenuLabelShort = "Excel";
    public const string Template = "Excel mẫu";
    public const string Import = "Import Excel";
    public const string Export = "Xuất Excel";
    public const string Importing = "Đang import...";
    public const string ImportFail = "Đã import thất bại file Excel.";
    public const string ImportEmpty = "Cảnh báo: file Excel không có dòng dữ liệu.";
    public const string ImportInvalidFile = "File Excel không đúng định dạng mẫu. Vui lòng Xuất Excel mẫu.";

    public static string ImportSuccess(int count, string unit) =>
        ToastCopy.OkItem("import", $"{count} {unit}");

    public static string ImportPartial(int success, int fail, string unit) =>
        ToastCopy.WarnItem("import", $"{success} {unit}", $"{fail} dòng lỗi");

    public const string DownloadSuccessTitle = "Lưu file Excel";
    public const string DownloadFail = "Không thể lưu file Excel.";
    public const string DownloadFileLocked =
        "Không thể ghi file vì file đang được mở trong ứng dụng khác (thường là Excel). " +
        "Vui lòng đóng file hoặc lưu với tên hoặc vị trí khác.";
    public const string OpenFileFail = "Đã lưu file nhưng không thể mở. Vui lòng mở thủ công từ thư mục đã lưu.";

    public static string DownloadSuccessMessage(string fileName) =>
        $"Đã lưu file Excel thành công:\n{fileName}\n\nBạn có muốn mở file không?";
}
