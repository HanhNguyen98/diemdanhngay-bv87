namespace BV87.Core.Constants;

/// <summary>Vietnamese UI strings for HEAD role screens — mirror frontend/constants/attendance.js.</summary>
public static class HeadUiStrings
{
    public const string NavUtilities = "Tiện ích";

    public static class Attendance
    {
        public const string PageTitle = "CHẤM CÔNG HẰNG NGÀY";
        public const string StaffListTitle = "DANH SÁCH NHÂN VIÊN";
        public const string SearchLabel = "Tìm kiếm";
        public const string SearchPlaceholder = "Tìm tên nhân viên hoặc mã số...";
        public const string StatusFilterLabel = "Trạng thái";
        public const string ApplyFilter = "Tìm kiếm";
        public const string Refresh = "Làm mới";
        public const string Loading = "Đang tải dữ liệu...";
        public const string QuickActions = "Chấm nhanh";
        public const string FilterAllStatus = "Tất cả trạng thái";
        public const string FilterUnchecked = "Chưa chấm";
        public const string UncheckedFilterTooltip =
            "Gồm nhân viên chưa có trạng thái và nhân viên đã có trạng thái nhưng còn thiếu giờ hoặc ghi chú. Cột trạng thái vẫn hiện tên trạng thái hiện có.";
        public const string DailyKpiChipTooltip =
            "Số toàn đơn vị — chỉ nhân viên đủ dữ liệu chấm công. Bộ lọc bảng không đổi các số này.";
        public const string ProgressScope = "toàn đơn vị";
        public const string TodayPill = "Hôm nay";
        public const string SelectOtherDateTooltip = "Chọn ngày khác";
        public const string ViewingHistoryPrefix = "Đang xem dữ liệu ngày";
        public const string ViewingHistoryReadOnlySuffix = "— chỉ xem, không chỉnh sửa";
        public const string ViewingHistoryEditableSuffix = "— có thể chỉnh sửa";
        public const string ReadOnlyBadge = "CHẾ ĐỘ XEM";
        public const string IncompleteExplainBanner =
            "Có thể chấm nhân viên còn thiếu dữ liệu — bắt buộc nhập lý do chấm bổ sung khi lưu. Nhân viên đã đủ dữ liệu chỉ sửa khi Admin mở khóa.";
        public const string IncompleteExplainNoteLabel = "Lý do chấm bổ sung (bắt buộc)";
        public const string IncompleteExplainNeedReason = "Vui lòng nhập lý do chấm bổ sung.";
        public const string UnlockRequestAction = "Gửi yêu cầu mở khóa";
        public const string UnlockRequestReasonPrompt = "Nhập lý do yêu cầu mở khóa (bắt buộc):";
        public const string UnlockRequestPending =
            "Đã gửi yêu cầu mở khóa — đang chờ Admin xác nhận.";
        public const string UnlockRequestSent = "Đã gửi yêu cầu mở khóa.";
        public const string UnlockRequestNeedReason = "Vui lòng nhập lý do yêu cầu mở khóa.";
        public const string UnlockRequestTooltipEnabled =
            "Gửi yêu cầu Admin mở khóa để sửa nhân viên đã đủ dữ liệu.";
        public const string UnlockRequestTooltipDisabledIncomplete =
            "Chỉ cần khi muốn sửa nhân viên đã đủ dữ liệu. Nhân viên chưa chấm / thiếu dữ liệu vẫn chấm được kèm lý do bổ sung.";
        public const string UnlockRequestTooltipPending =
            "Đã gửi yêu cầu — đang chờ Admin xác nhận.";
        public const string LoadError = "Không tải được dữ liệu Chấm công.";
        public const string VeSomSaved = "Đã lưu lý do về sớm.";
        public const string ColEmpCode = "MÃ NV";
        public const string ColFullname = "HỌ TÊN";
        public const string ColRank = "CẤP BẬC";
        public const string ColPosition = "CHỨC VỤ";
        public const string ColTimes = "GIỜ";
        public const string ColMachine = "MÁY";
        public const string ColStatus = "TRẠNG THÁI";
        public const string ColNote = "LÝ DO CHẤM BỔ SUNG";
    }

    public static class Statistics
    {
        public const string PageTitle = "THỐNG KÊ LỊCH SỬ CHẤM CÔNG";
        public const string TimeRangeLabel = "Khoảng thời gian";
        public const string DateFromLabel = "Từ ngày";
        public const string DateToLabel = "Đến ngày";
        public const string SearchLabel = "Họ tên";
        public const string SearchPlaceholder = "Tìm tên nhân viên";
        public const string ApplyFilter = "Tìm kiếm";
        public const string ClearFilter = "Xóa lọc";
        public const string Refresh = "Làm mới";
        public const string Loading = "Đang tải dữ liệu...";
        public const string LoadError = "Không tải được dữ liệu Thống kê.";
        public const string NoData = "Không có dữ liệu!";
        public const string NoHistory = "Không có dữ liệu!";
        public const string MaxRangeExceeded = "Khoảng thời gian tối đa là 366 ngày";
        public const string InvalidRange = "Ngày bắt đầu phải trước ngày kết thúc";
        public const string KpiUnit = "LƯỢT CHẤM CÔNG";
        public const string StatusChipTooltip =
            "Đếm mọi bản ghi có trạng thái này trong khoảng đã lọc (kể cả chưa đủ giờ).";
        public const string UncheckedChipTooltip =
            "Bản ghi đã có dòng nhưng chưa có trạng thái. Khác «Chưa chấm» trên màn Chấm công (thiếu giờ vẫn tính chưa chấm).";
        public const string HistoryTitle = "Danh sách chi tiết";
        public const string ExportExcel = "Xuất Excel";
        public const string ExportFilename = "lich-su-cham-cong.xlsx";
        public const string ExportSheet = "Lịch sử Chấm công";
        public const string UnitLabel = "kết quả";
        public const string ColDate = "NGÀY";
        public const string ColEmployee = "NHÂN VIÊN";
        public const string ColStatus = "TRẠNG THÁI";
        public const string ColNote = "GHI CHÚ";
        public const string PresetThisMonth = "THIS_MONTH";
        public const string PresetThisWeek = "THIS_WEEK";
        public const string PresetLastMonth = "LAST_MONTH";
        public const string PresetLast30Days = "LAST_30_DAYS";
        public const string PresetThisMonthLabel = "Tháng này";
        public const string PresetThisWeekLabel = "Tuần này";
        public const string PresetLastMonthLabel = "Tháng trước";
        public const string PresetLast30DaysLabel = "30 ngày qua";
    }

    public static class Staff
    {
        public const string PageTitle = "NHÂN VIÊN";
        public const string ListTitle = "DANH SÁCH NHÂN VIÊN";
        public const string SearchLabel = "Họ tên / Mã NV";
        public const string SearchPlaceholder = "Tìm tên hoặc mã nhân viên...";
        public const string FingerprintFilterLabel = "Vân tay";
        public const string ApplyFilter = "Tìm kiếm";
        public const string ClearFilter = "Xóa lọc";
        public const string Refresh = "Làm mới";
        public const string Loading = "Đang tải dữ liệu...";
        public const string LoadError = "Không tải được danh sách nhân viên.";
        public const string UnitLabel = "nhân viên";
        public const string ColAvatar = "ẢNH ĐẠI DIỆN";
        public const string ColEmpCode = "MÃ NV";
        public const string ColFullname = "HỌ TÊN";
        public const string ColFingerprint = "VÂN TAY";
        public const string ColActions = "THAO TÁC";
        public const string ActionsMenuLabel = "Thao tác";
        public const string AvatarAction = "Ảnh đại diện";
        public const string DeleteFingerprint = "Xóa vân tay";
        public const string StatsTotal = "Tổng nhân viên";
        public const string StatsRegistered = "Đã đăng ký vân tay";
        public const string StatsMissing = "Chưa đăng ký vân tay";
        public const string FilterAll = "Tất cả";
        public const string FilterRegistered = "Đã đăng ký";
        public const string FilterMissing = "Chưa đăng ký";
    }
}
