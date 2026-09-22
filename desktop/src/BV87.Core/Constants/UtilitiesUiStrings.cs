using BV87.Core.Helpers;

namespace BV87.Core.Constants;

/// <summary>Vietnamese UI strings for Admin utilities screens — mirror ADMIN_UI.dashboard utilities section.</summary>
public static class UtilitiesUiStrings
{
    public const string Loading = "Đang tải dữ liệu...";
    public const string DateRangeInvalid = "Từ ngày không được lớn hơn đến ngày.";
    public const string FilterDeptLabel = "Lọc đơn vị";
    public const string ApplyFilter = "Tìm kiếm";
    public const string ClearFilter = "Xóa lọc";
    public const string Refresh = "Làm mới";
    public const string DateRangeSeparator = "→";

    public static class UnlockRequests
    {
        public const string PageTitle = "YÊU CẦU MỞ KHÓA";
        public const string PageSubtitle = "Duyệt yêu cầu mở khóa từ Trưởng đơn vị";
        public const string ListTitle = "CHI TIẾT";
        public const string FilterStatus = "Trạng thái";
        public const string StatusPending = "Chờ xác nhận";
        public const string StatusApproved = "Đã mở khóa";
        public const string StatusRejected = "Đã từ chối";
        public const string ColDate = "NGÀY CHẤM CÔNG";
        public const string ColDept = "ĐƠN VỊ";
        public const string ColHead = "TRƯỞNG ĐƠN VỊ";
        public const string ColReason = "LÝ DO";
        public const string ColStatus = "TRẠNG THÁI";
        public const string ColTime = "GỬI LÚC";
        public const string ColActions = "THAO TÁC";
        public const string ActionsMenuLabel = "Thao tác";
        public const string Approve = "Xác nhận";
        public const string Reject = "Từ chối";
        public const string Empty = "Không có yêu cầu.";
        public const string RejectTitle = "Từ chối yêu cầu mở khóa";
        public const string RejectBadge = "TỪ CHỐI YÊU CẦU";
        public const string RejectHint = "Có thể ghi lý do từ chối (không bắt buộc).";
        public const string RejectPlaceholder = "Lý do từ chối...";
        public const string ApproveSuccess = "Đã mở khóa ngày công cho Trưởng đơn vị.";
        public const string RejectSuccess = "Đã từ chối yêu cầu mở khóa.";
        public const string UnitLabel = "yêu cầu";
    }

    public static class ReminderHistory
    {
        public const string PageTitle = "LỊCH SỬ GỬI NHẮC NHỞ";
        public const string PageSubtitle = "Nhắc thủ công theo đơn vị. Bản ghi tự động cũ vẫn xem được.";
        public const string StatsTitle = "Thống kê theo ĐƠN VỊ";
        public const string StatsTotalLabel = "Tổng lần nhắc";
        public const string StatsEmpty = "Không có dữ liệu!";
        public const string StatsColDept = "ĐƠN VỊ";
        public const string StatsColCount = "SỐ LẦN NHẮC";
        public const string StatsOthers = "Khác";
        public const string ListTitle = "CHI TIẾT";
        public const string FilterRange = "Ngày Chấm công";
        public const string FilterType = "Loại gửi";
        public const string FilterTypeAll = "Tất cả";
        public const string ColDate = "NGÀY CHẤM CÔNG";
        public const string ColDept = "ĐƠN VỊ";
        public const string ColType = "LOẠI";
        public const string ColTime = "THỜI GIAN GỬI";
        public const string Empty = "Không có dữ liệu!";
        public const string TriggerAuto = "Tự động";
        public const string TriggerManual = "Thủ công";
        public const string ExportExcel = "Xuất Excel";
        public const string ExportSheet = "Lịch sử nhắc nhở";
        public const string UnitLabel = "lần nhắc";
    }

    public static class AuditLog
    {
        public const string PageTitle = "NHẬT KÝ CHỈNH SỬA";
        public const string PageSubtitle = "Lịch sử thao tác chấm công trên hệ thống";
        public const string ListTitle = "CHI TIẾT";
        public const string FilterRange = "Thời gian thao tác";
        public const string ColTime = "THỜI GIAN";
        public const string ColUser = "TÀI KHOẢN";
        public const string ColDept = "ĐƠN VỊ";
        public const string ColEmp = "NHÂN VIÊN";
        public const string ColDate = "NGÀY CHẤM CÔNG";
        public const string ColAction = "HÀNH ĐỘNG";
        public const string ColIp = "IP";
        public const string Empty = "Không có dữ liệu!";
        public const string UnitLabel = "thao tác";
    }

    public static class FingerprintHistory
    {
        public const string PageTitle = "LỊCH SỬ VÂN TAY";
        public const string PageSubtitle = "Nhật ký đăng ký và xóa mẫu vân tay trên hệ thống";
        public const string ListTitle = "CHI TIẾT";
        public const string FilterRange = "Thời gian thao tác";
        public const string ColTime = "THỜI GIAN";
        public const string ColAction = "HÀNH ĐỘNG";
        public const string ColEmp = "NHÂN VIÊN";
        public const string ColDept = "ĐƠN VỊ";
        public const string ColActor = "THỰC HIỆN";
        public const string ColFinger = "GHI CHÚ NGÓN";
        public const string ColIp = "IP";
        public const string Empty = "Không có dữ liệu!";
        public const string UnitLabel = "thao tác";
    }

    public static class FingerprintEnroll
    {
        public const string PageTitle = "ĐĂNG KÝ VÂN TAY";
        public const string PageSubtitle = "Đăng ký hoặc đăng ký lại vân tay nhân viên qua thiết bị USB ZK9500";
        public const string StatsTotal = "Tổng";
        public const string StatsRegistered = "Đã đăng ký";
        public const string StatsMissing = "Chưa đăng ký";
        public const string FilterAll = "Tất cả";
        public const string FilterRegistered = "Đã đăng ký";
        public const string FilterMissing = "Chưa đăng ký";
        public const string StaffLabel = "Nhân viên";
        public const string DeptFilterLabel = "Lọc đơn vị";
        public const string RegistrationStatusFilterLabel = "Trạng thái đăng ký";
        public const string SearchLabel = "Họ tên / Mã NV";
        public const string SearchPlaceholder = "Tìm theo họ tên, mã nhân viên...";
        public const string SearchFilter = "Tìm kiếm";
        public const string StaffListEmpty = "Không có nhân viên phù hợp bộ lọc.";
        public const string StaffListTitle = "DANH SÁCH NHÂN VIÊN";
        public const string UnitLabel = "nhân viên";
        public const string ColStt = "STT";
        public const string ColEmpCode = "Mã NV";
        public const string ColFullname = "Họ tên";
        public const string ColRegistrationStatus = "Trạng thái đăng ký";
        public const string ConnectDevice = "Kết nối thiết bị";
        public const string DisconnectDevice = "Ngắt kết nối";
        public const string ReloadStaff = "Tải danh sách";
        public const string StartEnroll = "Bắt đầu đăng ký";
        public const string CancelEnroll = "Hủy đăng ký";
        public const string DeviceConnected = "Đã kết nối";
        public const string DeviceDisconnected = "Chưa kết nối";
        public const string PreviewWaiting = "Chờ đặt ngón tay…";
        public const string PreviewGateHint = "Chưa nhấn Bắt đầu đăng ký. Chọn nhân viên rồi bấm Bắt đầu đăng ký trước khi quét.";
        public const string EnrollStep = "Lần quét";
        public const string FingerLabelTitle = "Ghi chú ngón tay";
        public const string FingerLabelBadge = "GHI CHÚ NGÓN TAY";
        public const string FingerLabelHint = "Ví dụ: Ngón cái tay phải";
        public const string FingerLabelRequired = "Vui lòng nhập ghi chú ngón tay.";
        public const string OverwriteTitle = "Ghi đè đăng ký vân tay";
        public static string OverwriteMessage(string name, string? fingerLabel) =>
            string.IsNullOrWhiteSpace(fingerLabel)
                ? $"Nhân viên \"{name}\" đã có vân tay. Bạn có chắc muốn ghi đè?"
                : $"Nhân viên \"{name}\" đã đăng ký ({fingerLabel}). Bạn có chắc muốn ghi đè?";
        public const string EnrollSuccess = "Đã đăng ký vân tay thành công.";
        public static string EnrollSuccessDetail(string fullname) =>
            ToastCopy.Ok("đăng ký", "vân tay", ToastCopy.Staff(fullname));
        public const string EnrollSuccessTitle = "Đăng ký thành công";
        public const string SdkMatchInvalidParam = "Lỗi SDK khi so khớp vân tay (mã -5). Ngắt kết nối rồi thử lại.";
        public const string SameFingerError = "Vui lòng dùng cùng ngón tay đã quét trước đó.";
        public const string DeviceMissingDll = "Không tìm thấy libzkfp.dll. Cài driver ZKFinger hoặc copy DLL vào thư mục lib cạnh BV87.exe.";
        public const string DeviceOpenFail = "Không mở được thiết bị vân tay. Kiểm tra cáp USB ZK9500.";
        public const string DeviceHeldByKiosk = "Kiosk chưa nhường máy quét. Đợi vài giây rồi bấm Kết nối thiết bị. Nhân viên chưa chấm được trong lúc đăng ký.";
        public const string WaitingForKioskYield = "Đang chờ kiosk nhường máy quét. Nhân viên tạm thời chưa chấm được.";
        public const string NoDevice = "Không phát hiện thiết bị vân tay.";
        public const string ConnectSuccessHint = "Đã kết nối thiết bị. Chọn nhân viên và bắt đầu đăng ký.";
        public const string StartBlockedNoDevice = "Vui lòng kết nối thiết bị ZK9500 trước khi đăng ký.";
        public const string StartBlockedNoStaff = "Vui lòng chọn nhân viên cần đăng ký.";
        public const string StartEnrollTooltip = "Kết nối thiết bị và chọn nhân viên trước";
        public const string MergeFail = "Không ghép được mẫu vân tay. Vui lòng thử lại từ đầu.";
        public const string CancelFingerLabel = "Đã hủy — chưa lưu vân tay (thiếu ghi chú ngón).";
        public const string CancelEnrollMid = "Đã hủy đăng ký. Mẫu cũ (nếu có) không thay đổi.";
        public const string EnrollSaving = "Đang lưu vân tay lên hệ thống…";
        public const string ApplyFilter = "Áp dụng";
        public const string RefreshStaffList = "Làm mới";
        public const string EnrollScanStart = "Đặt ngón tay lên cảm biến (lần 1/3).";
        public static string ScanAgain(int completed) =>
            $"Cần quét cùng một ngón lần nữa ({completed}/3).";
        public static string ScanProgressBadge(int completed) => $"ĐANG QUÉT ({completed}/3)";
        public const string FingerLiftRejected = "Vui lòng nhấc ngón tay khỏi cảm biến trước khi quét tiếp.";
        public const string MergeInProgress = "Đang ghép mẫu vân tay…";
        public const string EnrollReadyForLabel = "Đã quét đủ 3 lần. Nhập ghi chú ngón tay để lưu.";
        public const string EnrollIncomplete = "Chưa đủ 3 lần quét. Vui lòng bắt đầu đăng ký lại.";
        public const string EnrollFailedTitle = "Đăng ký thất bại";
        public static string EnrollFailedDetail(string message) => $"Không lưu được vân tay: {message}";
        public const string AutoConnectSuccess = "Đã tự kết nối thiết bị ZK9500. Chọn nhân viên và bắt đầu đăng ký.";
        public static string AutoConnectRetry(int attempt, int max) =>
            $"Đang kết nối thiết bị… ({attempt}/{max})";
        public const string AutoConnectFail = "Chưa kết nối được ZK9500. Kiểm tra cáp USB/driver hoặc bấm Kết nối thiết bị.";
        public const string StartEnrollTooltipWaitingDevice = "Đang chờ kết nối thiết bị ZK9500…";
        public const string LiftFingerHint = "Nhấc ngón tay khỏi cảm biến, rồi đặt lại cùng một ngón.";
    }
}
