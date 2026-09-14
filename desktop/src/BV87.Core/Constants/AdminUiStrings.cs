namespace BV87.Core.Constants;

/// <summary>Vietnamese UI strings for Admin mode — mirror frontend/constants/admin.js dashboard section.</summary>
public static class AdminUiStrings
{
    public const string OverviewPageTitle = "TỔNG QUAN CHUNG";
    public const string DeptFilterAll = "Tất cả đơn vị";
    public const string SendReminder = "Gửi nhắc nhở";
    public const string ProgressTitle = "Tiến độ Chấm công";
    public const string RefreshDashboard = "Làm mới";
    public const string ColDept = "Đơn vị";
    public const string ColProgress = "Tiến độ";
    public const string ColRate = "Tỷ lệ";
    public const string ColStatus = "Trạng thái";
    public const string ColActions = "Thao tác";
    public const string ManageMenu = "Quản lý";
    public const string ViewDeptDetail = "Xem chi tiết";
    public const string LockDept = "Khóa sổ";
    public const string UnlockDept = "Mở khóa sổ";
    public const string BlockHeadEdit = "Khóa chỉnh sửa HEAD";
    public const string UnblockHeadEdit = "Mở chỉnh sửa HEAD";
    public const string Completed = "HOÀN THÀNH";
    public const string Incomplete = "CHƯA XONG";
    public const string KpiTotal = "Tổng quân số";
    public const string KpiScopeHospital = "Phạm vi: Toàn viện";
    public const string KpiUnchecked = "Chưa chấm";
    public const string UncheckedFilterTooltip =
        "Gồm nhân viên chưa có trạng thái và nhân viên đã có trạng thái nhưng còn thiếu giờ hoặc ghi chú. Cột trạng thái vẫn hiện tên trạng thái hiện có.";
    public const string ProgressScope = "toàn đơn vị";
    public const string DailyProgressTooltip =
        "Số toàn đơn vị — chỉ nhân viên đủ dữ liệu chấm công. Bộ lọc bảng không đổi các số này.";
    public const string FilterDeptLabel = "Lọc đơn vị";
    public const string ClearFilter = "Xóa lọc";
    public const string ShellBrandTitle = "BV87 — Quản trị";
    public const string Loading = "Đang tải bảng điều khiển...";
    public const string ApplyFilter = "Tìm kiếm";
    public const string ReminderModalTitle = "Gửi nhắc nhở Chấm công";
    public const string ReminderSend = "Gửi";
    public const string BlockReportReason = "Khóa chỉnh sửa HEAD từ bảng điều khiển";

    public const string DeptDetailTitle = "CHI TIẾT ĐƠN VỊ";
    public const string DeptDetailSelectDept = "Chọn đơn vị";
    public const string DeptDetailSelectDate = "Chọn ngày";
    public const string DeptDetailApplyFilter = "Tìm kiếm";
    public const string DeptDetailUnlock = "Mở khóa ngày";
    public const string DeptDetailRelock = "Thu hồi mở khóa";
    public const string DeptDetailApproveUnlock = "Xác nhận yêu cầu";
    public const string DeptDetailLoading = "Đang tải chi tiết Chấm công...";
    public const string DeptDetailEmpty = "Không có dữ liệu!";
    public const string DeptDetailScanLogs = "Chi tiết quét";
    public const string UnlockReasonPrompt = "Lý do mở khóa (bắt buộc)";
    public const string DeptDetailStaffListTitle = "DANH SÁCH NHÂN VIÊN";
    public const string DeptDetailSearchPlaceholder = "Tìm theo tên, mã NV, chức vụ…";
    public const string DeptDetailStatusFilter = "Trạng thái";
    public const string DeptDetailExportReport = "Xuất báo cáo";
    public const string DeptDetailQuickActions = "Chấm nhanh";
    public const string DeptDetailActionsMenu = "Thao tác";
    public const string DeptDetailFillTimesAction = "Điền giờ";
    public const string DeptDetailPayrollApproveAction = "Duyệt bổ sung giờ";
    public const string DeptDetailClearAction = "Đưa về chưa chấm";

    public const string ScanLogTitle = "Chi tiết quét";
    public const string ScanLogColTime = "Thời điểm";
    public const string ScanLogColDirection = "Hướng";
    public const string ScanLogColScore = "Độ khớp vân tay";
    public const string ScanLogColMachine = "Máy";
    public const string ScanLogColMessage = "Ghi chú";
    public const string ScanLogEmpty = "Chưa có lần quét trong ngày này.";
    public const string ScanLogLoading = "Đang tải...";
    public const string ScanLogLoadError = "Không tải được lịch sử quét.";

    public const string FillTimesTitle = "Điền giờ vào / ra";
    public const string FillTimesHint = "Chỉ điền các mốc giờ đang trống. Trạng thái chuyên cần được hệ thống tính theo quy tắc.";
    public const string FillTimesHeadReasonTitle = "Giải trình của Trưởng đơn vị";
    public const string FillTimesHeadReasonIntent = "Hướng xử lý";
    public const string FillTimesHeadReasonText = "Lý do thiếu giờ";
    public const string FillTimesSubmit = "Lưu giờ";
    public const string FillTimesNeedOne = "Nhập ít nhất một giờ đang trống.";
    public const string FillTimesError = "Không lưu được giờ.";
    public const string FillTimesAlreadySet = "Đã có";
    public const string FillTimesLabelMorningIn = "Vào sáng";
    public const string FillTimesLabelNoonOut = "Ra trưa";
    public const string FillTimesLabelAfternoonIn = "Vào chiều";
    public const string FillTimesLabelAfternoonOut = "Ra chiều";

    public const string PayrollFillApproveTitle = "Duyệt bổ sung giờ hành chính";
    public const string PayrollFillApproveHint = "Xác nhận bổ sung giờ hành chính theo hướng nghỉ trực đã giải trình.";
    public const string PayrollFillApproveSubmit = "Duyệt bổ sung giờ";

    public const string ClearAttendanceTitle = "Đưa về chưa chấm";
    public const string ClearAttendanceHint = "Thao tác này xóa mềm dữ liệu chấm công trong ngày và đưa nhân viên về trạng thái chưa chấm.";
    public const string ClearAttendanceAfterSubmitWarn = "Đơn vị đã nộp báo cáo — thao tác can thiệp cần lý do rõ ràng.";
    public const string ClearAttendanceReason = "Lý do";
    public const string ClearAttendanceReasonPlaceholder = "Nhập lý do can thiệp…";
    public const string ClearAttendanceSubmit = "Xác nhận";
    public const string ClearAttendanceNeedReason = "Vui lòng nhập lý do.";
    public const string ClearAttendanceError = "Không đưa về chưa chấm được.";
    public const string ClearAttendanceSuccess = "Đã đưa về chưa chấm.";

    public const string NavDashboard = "Bảng điều khiển";
    public const string NavCatalog = "Danh mục hành chính";
    public const string NavUtilities = "Tiện ích";
    public const string NavSettings = "Cài đặt";
}
