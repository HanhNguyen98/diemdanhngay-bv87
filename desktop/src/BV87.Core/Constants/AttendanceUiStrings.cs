using BV87.Core.Helpers;

namespace BV87.Core.Constants;

/// <summary>Vietnamese UI strings for shared attendance modals — mirror frontend/constants/attendance.js.</summary>
public static class AttendanceUiStrings
{
    public const string NghiTrucWizardTitle = "Nghỉ trực — giải trình & chấm công";
    public const string NghiTrucWizardSectionExplain = "Giải trình thiếu giờ";
    public const string NghiTrucWizardSectionAssign = "Chấm nghỉ trực";
    public const string NghiTrucWizardHint =
        "Nửa buổi chiều: vẫn quét vào sáng / ra trưa. Nghỉ 1 ngày: kiosk từ chối mọi lần quét.";
    public const string NghiTrucWizardReassignHint =
        "Đã chấm nghỉ trực — có thể đổi 1 ngày ↔ nửa buổi chiều hoặc cập nhật lý do.";
    public const string NghiTrucWizardIntentLabel = "Loại nghỉ trực";
    public const string NghiTrucWizardReasonLabel = "Lý do (Trưởng đơn vị ghi nhận)";
    public const string NghiTrucWizardReasonPlaceholder = "Ví dụ: Ca trực đêm, chỉ quét ra trưa, chiều nghỉ trực…";
    public const string NghiTrucWizardReasonFieldHint =
        "Đây là nội dung do Trưởng đơn vị nhập, không phải kết luận tự động từ giờ quét.";
    public const string NghiTrucWizardPunchTimesLabel = "Giờ hiện có";
    public const string NghiTrucWizardPunchMorningIn = "S";
    public const string NghiTrucWizardPunchNoonOut = "T";
    public const string NghiTrucWizardPunchAfternoonIn = "C";
    public const string NghiTrucWizardPunchAfternoonOut = "V";
    public const string NghiTrucWizardCancel = "Hủy";
    public const string NghiTrucWizardSubmit = "Lưu & chấm nghỉ trực";
    public const string NghiTrucWizardSuccess = "Đã chấm nghỉ trực.";
    public const string NghiTrucWizardNeedReason = "Vui lòng nhập lý do thiếu giờ.";
    public const string NghiTrucWizardNeedIntent = "Vui lòng chọn loại nghỉ trực.";
    public const string NghiTrucWizardNeedDates = "Vui lòng chọn đủ Từ ngày và Đến ngày.";
    public const string NghiTrucToastDanger = "Không chấm được nghỉ trực.";
    public const string NghiTrucIntentFullCaption = "Kiosk từ chối mọi lần quét trong ngày.";
    public const string NghiTrucIntentHalfAfternoonCaption = "Vẫn quét vào sáng / ra trưa; chiều không quét.";
    public const string ManualRangeNoteOptional = "Ghi chú (tùy chọn)";
    public const string ManualRangeNoteRequired = "Lý do giải trình (bắt buộc)";
    public const string IncompleteExplainNeedReason = "Vui lòng nhập lý do giải trình thiếu dữ liệu chấm công.";
    public const string ManualRangeFrom = "Từ ngày";
    public const string ManualRangeTo = "Đến ngày";
    public const string ManualRangeInvalidOrder = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
    public const string ManualRangeTooLong = "Khoảng ngày tối đa 366 ngày.";

    public const string ManualScheduleTitle = "Lịch thủ công";
    public const string ManualScheduleOpenLink = "Lịch thủ công";
    public const string ManualScheduleFilterFrom = "Từ";
    public const string ManualScheduleFilterTo = "Đến";
    public const string ManualScheduleFilterSearch = "Tìm";
    public const string ManualScheduleFilterStatus = "Trạng thái";
    public const string ManualScheduleFilterStatusAll = "Tất cả";
    public const string ManualScheduleStatusNghiPhep = "Nghỉ phép";
    public const string ManualScheduleStatusDiHoc = "Đi học";
    public const string ManualScheduleStatusCongTac = "Đi công tác";
    public const string ManualScheduleStatusThaiSan = "Thai sản";
    public const string ManualScheduleColFrom = "Từ ngày";
    public const string ManualScheduleColTo = "Đến ngày";
    public const string ManualScheduleColDays = "Số ngày";
    public const string ManualScheduleColStatus = "Trạng thái";
    public const string ManualScheduleUnitLabel = "khoảng";
    public const string ManualScheduleEmpty =
        "Chưa có lịch nghỉ phép / đi học / công tác / thai sản trong khoảng đã chọn.";
    public const string ManualScheduleLoading = "Đang tải...";
    public const string ManualScheduleClose = "Đóng";
    public const string ManualScheduleLoadError = "Không tải được lịch thủ công.";
    public const string ManualScheduleInvalidOrder = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
    public const string ManualScheduleTooLong = "Khoảng xem tối đa 400 ngày.";
    public const string ManualScheduleNeedDates = "Vui lòng chọn đủ Từ và Đến.";

    public static string FormatManualScheduleStaffInfo(string empCode, string fullname) =>
        $"Thông tin nhân viên: {empCode} - {fullname}";

    public const string NghiTrucIntentHalfAfternoon = "Nghỉ trực nửa buổi chiều";
    public const string NghiTrucIntentFull = "Nghỉ trực 1 ngày";
    public const string NghiTrucBadge = "NGHỈ TRỰC";
    public const string NghiTrucSubtitleFull = "1 ngày";
    public const string NghiTrucSubtitleHalfAfternoon = "Nửa buổi chiều";
    public const string NghiTrucSubtitleHalfMorning = "Nửa buổi sáng";

    public static string FormatNghiTrucDayCount(int days) => $"{days} ngày";

    public static string FormatNghiTrucSummary(string staffName, string intentLabel, string from, string to) =>
        $"{staffName} · {intentLabel} · {from}→{to}";

    public static string FormatNghiTrucToastSuccess(string staffName, string intentLabel) =>
        ToastCopy.Ok("chấm", intentLabel, ToastCopy.Staff(staffName));

    public static string FormatNghiTrucToastWarning(
        string staffName, string intentLabel, int updatedCount, int fingerprintSkip, int softLockSkip)
    {
        var content = string.IsNullOrWhiteSpace(intentLabel)
            ? DaysPhrase(updatedCount)
            : $"{intentLabel} {DaysPhrase(updatedCount)}".Trim();
        return ToastCopy.Warn(
            "chấm",
            content,
            ToastCopy.Staff(staffName),
            ToastCopy.SkipReason(fingerprintSkip, softLockSkip));
    }

    public static string FormatNghiTrucToastFail(string staffName) =>
        ToastCopy.Fail("chấm", "nghỉ trực", ToastCopy.Staff(staffName));

    public static string FormatManualRangeSuccess(string staffName, string statusLabel, int updatedCount) =>
        ToastCopy.Ok("gán", $"{statusLabel} {DaysPhrase(updatedCount)}".Trim(), ToastCopy.Staff(staffName));

    public static string FormatManualRangeWarning(
        string staffName, string statusLabel, int updatedCount, int fingerprintSkip, int softLockSkip) =>
        ToastCopy.Warn(
            "gán",
            $"{statusLabel} {DaysPhrase(updatedCount)}".Trim(),
            ToastCopy.Staff(staffName),
            ToastCopy.SkipReason(fingerprintSkip, softLockSkip));

    public static string FormatManualRangeFail(string staffName, string statusLabel) =>
        ToastCopy.Fail("gán", statusLabel, ToastCopy.Staff(staffName));

    private static string DaysPhrase(int count) => ToastCopy.Days(count);
}
