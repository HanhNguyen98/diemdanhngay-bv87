namespace BV87.Core.Constants;

/// <summary>Vietnamese UI strings for Admin catalog screens — mirror frontend/constants/admin.js staffRanks/staffPositions.</summary>
public static class CatalogUiStrings
{
    public const string Loading = "Đang tải danh mục...";
    public const string ApplyFilter = "Tìm kiếm";
    public const string ClearFilter = "Xóa lọc";
    public const string Refresh = "Làm mới";
    public const string Edit = "Sửa";
    public const string Delete = "Xóa";
    public const string Save = "Lưu";
    public const string Cancel = "Hủy";
    public const string LoadingCode = "Đang lấy mã...";
    public const string Active = "Đang sử dụng";
    public const string Inactive = "Ngưng sử dụng";
    public const string ColStt = "STT";
    public const string ColActions = "THAO TÁC";

    public static string DeleteBlocked(long usageCount) =>
        $"Không thể xóa — đang có {usageCount:N0} nhân viên sử dụng";

    public static class Ranks
    {
        public const string PageTitle = "DANH MỤC CẤP BẬC";
        public const string NewButton = "Thêm cấp bậc";
        public const string SearchPlaceholder = "Tìm theo mã, tên cấp bậc...";
        public const string UnitLabel = "cấp bậc";
        public const string StatsTotal = "Tổng cấp bậc";
        public const string StatsActive = "Đang sử dụng";
        public const string StatsInactive = "Ngưng sử dụng";
        public const string ColCode = "MÃ";
        public const string ColName = "TÊN CẤP BẬC";
        public const string ColSort = "THỨ TỰ";
        public const string ColUsage = "NHÂN VIÊN";
        public const string ColStatus = "TRẠNG THÁI";
        public const string FormTitleCreate = "Thêm cấp bậc mới";
        public const string FormTitleEdit = "Cập nhật cấp bậc";
        public const string DeleteTitle = "Xóa cấp bậc";
        public const string FormCode = "Mã cấp bậc";
        public const string FormName = "Tên cấp bậc";
        public const string FormSortOrder = "Thứ tự sắp xếp";
        public const string FormActive = "Trạng thái sử dụng";
        public const string NameRequired = "Tên cấp bậc là bắt buộc";
        public const string FlashCreate = "Đã thêm cấp bậc mới";
        public const string FlashUpdate = "Đã cập nhật cấp bậc";
        public const string FlashDeleteFail = "Không thể xóa cấp bậc";

        public static string DeleteMessage(string name) =>
            $"Bạn có chắc muốn xóa cấp bậc \"{name}\"? Chỉ xóa được khi không còn nhân viên sử dụng.";

        public static string FlashDelete(string name) => $"Đã xóa cấp bậc \"{name}\"";
    }

    public static class Positions
    {
        public const string PageTitle = "DANH MỤC CHỨC VỤ";
        public const string NewButton = "Thêm chức vụ";
        public const string SearchPlaceholder = "Tìm theo mã, tên chức vụ...";
        public const string UnitLabel = "chức vụ";
        public const string StatsTotal = "Tổng chức vụ";
        public const string StatsActive = "Đang sử dụng";
        public const string StatsInactive = "Ngưng sử dụng";
        public const string ColCode = "MÃ";
        public const string ColName = "TÊN CHỨC VỤ";
        public const string ColSort = "THỨ TỰ";
        public const string ColUsage = "NHÂN VIÊN";
        public const string ColStatus = "TRẠNG THÁI";
        public const string FormTitleCreate = "Thêm chức vụ mới";
        public const string FormTitleEdit = "Cập nhật chức vụ";
        public const string DeleteTitle = "Xóa chức vụ";
        public const string FormCode = "Mã chức vụ";
        public const string FormName = "Tên chức vụ";
        public const string FormSortOrder = "Thứ tự sắp xếp";
        public const string FormActive = "Trạng thái sử dụng";
        public const string NameRequired = "Tên chức vụ là bắt buộc";
        public const string FlashCreate = "Đã thêm chức vụ mới";
        public const string FlashUpdate = "Đã cập nhật chức vụ";
        public const string FlashDeleteFail = "Không thể xóa chức vụ";

        public static string DeleteMessage(string name) =>
            $"Bạn có chắc muốn xóa chức vụ \"{name}\"? Chỉ xóa được khi không còn nhân viên sử dụng.";

        public static string FlashDelete(string name) => $"Đã xóa chức vụ \"{name}\"";
    }

    public static class StatusCatalog
    {
        public const string PageTitle = "TRẠNG THÁI CHẤM CÔNG";
        public const string NewButton = "Thêm trạng thái";
        public const string SearchPlaceholder = "Tìm theo mã, tên trạng thái...";
        public const string UnitLabel = "trạng thái";
        public const string StatsTotal = "Tổng trạng thái";
        public const string StatsActive = "Đang sử dụng";
        public const string StatsInactive = "Ngưng sử dụng";
        public const string ColCode = "MÃ";
        public const string ColLabel = "TÊN HIỂN THỊ";
        public const string ColBadge = "NHÃN BADGE";
        public const string ColSort = "THỨ TỰ";
        public const string ColUsage = "SỬ DỤNG";
        public const string ColStatus = "TRẠNG THÁI";
        public const string FormTitleCreate = "Thêm trạng thái mới";
        public const string FormTitleEdit = "Cập nhật trạng thái";
        public const string DeleteTitle = "Xóa trạng thái";
        public const string FormCode = "Mã trạng thái";
        public const string FormLabel = "Tên hiển thị";
        public const string FormBadgeLabel = "Nhãn badge";
        public const string FormColor = "Màu hiển thị";
        public const string FormIcon = "Biểu tượng";
        public const string FormSortOrder = "Thứ tự sắp xếp";
        public const string FormActive = "Trạng thái sử dụng";
        public const string FormManualAllowed = "Cho phép chấm thủ công";
        public const string FormManualAllowedHint = "Cho phép HEAD/Admin chấm thủ công";
        public const string FormGroupParent = "Là trạng thái cha";
        public const string FormGroupParentHint = "Chỉ làm nút nhóm / KPI cha";
        public const string FormParentCode = "Trạng thái cha";
        public const string FormParentCodePlaceholder = "— Chọn trạng thái cha —";
        public const string LabelRequired = "Tên hiển thị là bắt buộc";
        public const string CodeRequired = "Mã trạng thái là bắt buộc";
        public const string BadgeRequired = "Nhãn badge là bắt buộc";
        public const string SortOrderInvalid = "Thứ tự sắp xếp phải là số không âm";
        public const string ColorIconRequired = "Chọn màu và biểu tượng hiển thị";
        public const string FormSaveFail = "Không thể lưu trạng thái. Vui lòng thử lại.";
        public const string FlashCreate = "Đã thêm trạng thái thành công.";
        public const string FlashUpdate = "Đã cập nhật trạng thái thành công.";
        public const string FlashDeleteFail = "Không thể xóa trạng thái. Vui lòng thử lại.";

        public static string DeleteMessage(string name) =>
            $"Bạn có chắc muốn xóa trạng thái \"{name}\"? Thao tác không thể hoàn tác.";

        public static string FlashDelete(string name) => $"Đã xóa trạng thái \"{name}\" thành công.";

        public static string DeleteBlocked(long usageCount) =>
            $"Đang có {usageCount:N0} bản ghi Chấm công — hãy Ngưng hoạt động thay vì xóa";
    }

    public static class Departments
    {
        public const string PageTitle = "DANH MỤC ĐƠN VỊ";
        public const string NewButton = "Thêm đơn vị";
        public const string ManageGroupsButton = "Quản lý nhóm";
        public const string SearchPlaceholder = "Tìm theo mã, ký hiệu, tên, trưởng đơn vị...";
        public const string UnitLabel = "đơn vị";
        public const string GroupFilterLabel = "Lọc theo nhóm";
        public const string GroupFilterAll = "Tất cả";
        public const string StatsTotalDepts = "Tổng đơn vị";
        public const string StatsTotalStaff = "Tổng nhân viên";
        public const string StatsEfficiency = "Tỷ lệ hoạt động";
        public const string ColCode = "MÃ ĐƠN VỊ";
        public const string ColGroup = "KHỐI";
        public const string ColUnitCode = "KÝ HIỆU ĐƠN VỊ";
        public const string ColName = "TÊN ĐƠN VỊ";
        public const string ColHead = "TRƯỞNG ĐƠN VỊ";
        public const string ColStaff = "QUÂN SỐ";
        public const string ColActions = "THAO TÁC";
        public const string ColStt = "STT";
        public const string FormTitleCreate = "Thêm đơn vị mới";
        public const string FormTitleEdit = "Cập nhật đơn vị";
        public const string DeleteTitle = "Xóa đơn vị";
        public const string FormDeptCode = "Mã đơn vị";
        public const string FormGroup = "Nhóm đơn vị";
        public const string FormGroupPlaceholder = "— Chọn nhóm —";
        public const string FormUnitCode = "Ký hiệu đơn vị (vd: C11)";
        public const string FormDeptName = "Tên đơn vị";
        public const string FormHead = "Trưởng đơn vị";
        public const string FormHeadPlaceholder = "— Chọn trưởng đơn vị —";
        public const string FormHeadHintCreate = "Thêm nhân viên vào đơn vị trước, sau đó cấu hình trưởng đơn vị khi chỉnh sửa.";
        public const string DeptNameRequired = "Tên đơn vị là bắt buộc";
        public const string GroupRequired = "Nhóm đơn vị là bắt buộc";
        public const string FlashCreate = "Đã thêm đơn vị thành công.";
        public const string FlashUpdate = "Đã cập nhật đơn vị thành công.";
        public const string FlashDeleteFail = "Không thể xóa đơn vị. Vui lòng thử lại.";

        public static string DeleteMessage(string name) =>
            $"Bạn có chắc muốn xóa đơn vị \"{name}\"? Thao tác không thể hoàn tác.";

        public static string FlashDelete(string name) => $"Đã xóa \"{name}\" thành công.";

        public static string DeleteBlocked(long staffCount) =>
            $"Đang có {staffCount:N0} nhân viên — không thể xóa đơn vị";
    }

    public static class DepartmentGroups
    {
        public const string ManageTitle = "Quản lý nhóm đơn vị";
        public const string NewButton = "Thêm nhóm";
        public const string FormTitleCreate = "Thêm nhóm mới";
        public const string FormTitleEdit = "Cập nhật nhóm";
        public const string DeleteTitle = "Xóa nhóm";
        public const string ColCode = "MÃ NHÓM";
        public const string ColName = "TÊN NHÓM";
        public const string ColSort = "THỨ TỰ";
        public const string ColDeptCount = "SỐ ĐƠN VỊ";
        public const string FormGroupName = "Tên nhóm";
        public const string FormSortOrder = "Thứ tự sắp xếp";
        public const string GroupNameRequired = "Tên nhóm là bắt buộc";
        public const string FlashCreate = "Đã thêm nhóm mới";
        public const string FlashUpdate = "Đã cập nhật nhóm";
        public const string FlashDeleteFail = "Không thể xóa nhóm";

        public static string DeleteMessage(string name) =>
            $"Bạn có chắc muốn xóa nhóm \"{name}\"? Chỉ xóa được khi nhóm không còn đơn vị.";

        public static string FlashDelete(string name) => $"Đã xóa nhóm \"{name}\"";

        public static string DeleteBlocked(long deptCount) =>
            $"Đang có {deptCount:N0} đơn vị — không thể xóa nhóm";
    }

    public static class Staff
    {
        public const string PageTitle = "DANH MỤC NHÂN VIÊN";
        public const string NewButton = "Thêm nhân viên";
        public const string SearchPlaceholder = "Tìm theo mã, họ tên...";
        public const string UnitLabel = "nhân viên";
        public const string DeptFilterLabel = "Lọc theo đơn vị";
        public const string DeptFilterAll = "Tất cả đơn vị";
        public const string StatsTotal = "Tổng nhân viên";
        public const string StatsActive = "Đang hoạt động";
        public const string StatsInactive = "Ngưng hoạt động";
        public const string ColStt = "STT";
        public const string ColDept = "ĐƠN VỊ";
        public const string ColAvatar = "ẢNH ĐẠI DIỆN";
        public const string ColCode = "MÃ NV";
        public const string ColName = "HỌ VÀ TÊN";
        public const string ColRank = "CẤP BẬC";
        public const string ColPosition = "CHỨC VỤ";
        public const string ColStatus = "TRẠNG THÁI";
        public const string ColFingerprint = "VÂN TAY";
        public const string ColActions = "THAO TÁC";
        public const string ActionsMenuLabel = "Thao tác";
        public const string AvatarAction = "Ảnh đại diện";
        public const string AvatarTitle = "Cập nhật ảnh đại diện";
        public const string AvatarPick = "Chọn ảnh";
        public const string AvatarPickFromComputer = "Chọn ảnh từ máy tính";
        public const string AvatarRemove = "Xóa ảnh hiện tại";
        public const string AvatarHint = "JPG, PNG, GIF hoặc WEBP — tối đa 5MB.";
        public const string AvatarNote = "Vui lòng sử dụng ảnh chân dung rõ mặt để thuận tiện cho việc nhận diện nhân sự trong hệ thống Bệnh viện.";
        public const string AvatarSave = "Lưu";
        public const string AvatarSuccess = "Đã cập nhật ảnh đại diện.";
        public const string AvatarFail = "Không thể cập nhật ảnh đại diện.";
        public const string EditAction = "Sửa";
        public const string DeleteAction = "Xóa";
        public const string FingerprintRegistered = "Đã đăng ký";
        public const string FingerprintMissing = "Chưa đăng ký";
        public const string Active = "Đang hoạt động";
        public const string Inactive = "Ngưng hoạt động";
        public const string FormTitleCreate = "Thêm mới nhân viên";
        public const string FormTitleEdit = "Cập nhật nhân viên";
        public const string FormTitleEditTransfer = "Cập nhật & luân chuyển";
        public const string DeleteTitle = "Xóa nhân viên";
        public const string FormFullname = "Họ và tên";
        public const string FormDept = "Đơn vị";
        public const string FormDeptPlaceholder = "— Chọn đơn vị —";
        public const string FormRank = "Cấp bậc";
        public const string FormPosition = "Chức vụ";
        public const string FormTransferReason = "Lý do luân chuyển";
        public const string FormTransferReasonPlaceholder = "Nhập lý do luân chuyển đơn vị...";
        public const string FormHeadRevokeCheckbox = "Thu hồi quyền trưởng đơn vị tại đơn vị cũ";
        public const string FullnameRequired = "Họ tên là bắt buộc";
        public const string DeptRequired = "Vui lòng chọn đơn vị";
        public const string TransferReasonRequired = "Vui lòng nhập lý do luân chuyển đơn vị";
        public const string TransferHeadRevokeRequired = "Vui lòng tick xác nhận thu hồi quyền trưởng đơn vị tại đơn vị cũ";
        public const string TransferAction = "Chuyển ĐV";
        public const string HistoryAction = "Lịch sử";
        public const string TransferModalTitle = "Chuyển đơn vị làm việc";
        public const string TransferFromLabel = "Đơn vị hiện tại";
        public const string TransferToLabel = "Đơn vị đích";
        public const string TransferSubmit = "Xác nhận chuyển";
        public const string TransferFingerprintHint = "Vân tay đã đăng ký vẫn dùng được tại mọi máy quét sau khi chuyển đơn vị.";
        public const string FingerprintDeleteLabel = "Xóa vân tay";
        public const string FingerprintDeleteTitle = "Xóa đăng ký vân tay";
        public static string FingerprintDeleteMessage(string name, string? fingerLabel) =>
            string.IsNullOrWhiteSpace(fingerLabel)
                ? $"Xóa đăng ký vân tay của \"{name}\"? Nhân viên cần đăng ký lại trên máy Agent."
                : $"Xóa đăng ký vân tay ({fingerLabel}) của \"{name}\"? Nhân viên cần đăng ký lại trên máy Agent.";
        public const string FingerprintDeleteSuccess = "Đã xóa đăng ký vân tay.";
        public const string FingerprintDeleteFail = "Không thể xóa đăng ký vân tay.";
        public const string FingerprintReEnrollHint = "Sau khi xóa, hướng dẫn nhân viên đăng ký lại trên máy Agent (Java).";
        public const string HistoryEmpty = "Chưa có lịch sử luân chuyển đơn vị";
        public const string HistoryInitial = "Gán ban đầu";
        public const string HistoryCurrent = "Hiện tại";
        public const string FlashCreate = "Đã thêm nhân viên thành công.";
        public const string FlashUpdate = "Đã cập nhật nhân viên thành công.";
        public const string FlashTransfer = "Đã chuyển đơn vị thành công.";
        public const string FlashTransferHeadRevoke = "Đã luân chuyển và thu hồi quyền trưởng đơn vị.";
        public const string FlashDeleteFail = "Không thể xóa nhân viên. Vui lòng thử lại.";

        public static string DeleteMessage(string name) =>
            $"Bạn có chắc muốn xóa nhân viên \"{name}\"? Thao tác không thể hoàn tác.";

        public static string FlashDelete(string name) => $"Đã xóa \"{name}\" thành công.";

        public static string TransferModalSubtitle(string name, string code) => $"{name} ({code})";

        public static string HistoryTitle(string name, string code) => $"Lịch sử luân chuyển — {name} ({code})";

        public static string FingerprintLabel(string? fingerLabel) =>
            string.IsNullOrWhiteSpace(fingerLabel)
                ? FingerprintRegistered
                : $"{FingerprintRegistered} — {fingerLabel}";

        public static string TransferHeadHint(string deptLabel, string? username)
        {
            var account = string.IsNullOrWhiteSpace(username) ? string.Empty : $" Tài khoản: {username}.";
            return $"Nhân viên đang là trưởng đơn vị tại {deptLabel}.{account} Cần tick xác nhận thu hồi quyền khi luân chuyển.";
        }
    }
}
