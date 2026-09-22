namespace BV87.Core.Constants;

/// <summary>Vietnamese UI strings for Admin settings screens — mirror frontend/constants/admin.js.</summary>
public static class SettingsUiStrings
{
    public const string ApplyFilter = "Tìm kiếm";
    public const string ClearFilter = "Xóa lọc";
    public const string Refresh = "Làm mới";
    public const string Save = "Lưu";
    public const string Cancel = "Hủy";
    public const string Close = "Đóng";
    public const string Edit = "Sửa";
    public const string Delete = "Xóa";
    public const string Copy = "Sao chép";
    public const string Copied = "Đã sao chép";
    public const string Loading = "Đang tải...";
    public const string SaveSettings = "Lưu cài đặt";
    public const string Saving = "Đang lưu...";
    public const string ShowPasswordTooltip = "Hiện mật khẩu";
    public const string HidePasswordTooltip = "Ẩn mật khẩu";

    public static class ChangePassword
    {
        public const string PageTitle = "ĐỔI MẬT KHẨU";
        public const string PageSubtitle = "Cập nhật mật khẩu đăng nhập tài khoản của bạn";
        public const string HeadPageSubtitle = "Nhập mật khẩu mới và xác nhận để cập nhật";
        public const string CurrentPassword = "Mật khẩu hiện tại";
        public const string CurrentPasswordRequired = "Mật khẩu hiện tại không được để trống";
        public const string NewPassword = "Mật khẩu mới";
        public const string ConfirmPassword = "Xác nhận mật khẩu mới";
        public const string Submit = "Cập nhật mật khẩu";
        public const string Saving = "Đang cập nhật...";
        public const string Success = "Đã cập nhật mật khẩu thành công";
        public const string Mismatch = "Xác nhận mật khẩu không khớp";
        public const string MinLength = "Mật khẩu mới phải có ít nhất 6 ký tự";

        public const string AdminResetSectionTitle = "Đặt lại mật khẩu người dùng";
       
        public const string AdminResetUserLabel = "Tên nhân viên";
        public const string AdminResetDeptLabel = "Đơn vị";
        public const string AdminResetSearchLabel = "Tìm theo tên, tên đăng nhập";
        public const string AdminResetUserRequired = "Vui lòng chọn nhân viên";
        public const string AdminResetSubmit = "Đặt lại mật khẩu";
        public const string AdminResetSaving = "Đang đặt lại...";
        public const string AdminResetNoResults = "Không tìm thấy tài khoản phù hợp.";
    }

    public static class Accounts
    {
        public const string PageTitle = "PHÂN QUYỀN";
        public const string PageSubtitle = "Quản lý tài khoản Quản trị viên, Trực ban và Trưởng đơn vị";
        public const string HubTabAccounts = "Tài khoản";
        public const string HubTabGroups = "Nhóm quyền";
        public const string NewButton = "Thêm tài khoản";
        public const string SearchPlaceholder = "Tìm tên đăng nhập, họ tên, mã NV, phòng ...";
        public const string RoleFilterLabel = "Vai trò";
        public const string StatusFilterLabel = "Trạng thái";
        public const string RoleAll = "Tất cả vai trò";
        public const string StatusAll = "Tất cả trạng thái";
        public const string RoleAdmin = "Quản trị viên";
        public const string RoleDuty = "Trực ban bệnh viện";
        public const string RoleHead = "Trưởng đơn vị";
        public const string Active = "Đang hoạt động";
        public const string Inactive = "Ngưng hoạt động";
        public const string UnitLabel = "tài khoản";
        public const string ColUsername = "TÊN ĐĂNG NHẬP";
        public const string ColEmpCode = "MÃ NV";
        public const string ColFullname = "HỌ VÀ TÊN";
        public const string ColRole = "NHÓM QUYỀN";
        public const string ColDept = "ĐƠN VỊ";
        public const string ColStatus = "TRẠNG THÁI";
        public const string ColActions = "THAO TÁC";
        public const string ActionsMenuLabel = "Thao tác";
        public const string FormTitleCreate = "Thêm tài khoản";
        public const string FormHeaderBadgeCreate = "THÊM TÀI KHOẢN";
        public const string FormTitleEdit = "Cập nhật tài khoản";
        public const string DeleteTitle = "Xóa tài khoản";
        public const string ResetPasswordAction = "Đặt lại MK";
        public const string GrantScreensAction = "Cấp màn hình";
        public const string GrantScreensTitle = "Cấp màn hình";
        public const string GrantScreensBadge = "CẤP QUYỀN MÀN HÌNH";
        public const string GrantScreensSave = "Lưu phân quyền màn hình";
        public const string GrantScreensHint =
            "Tick màn hình để cấp toàn bộ thao tác trong màn đó. Bỏ hết tick rồi Lưu để về mặc định theo vai trò.";
        public const string GrantScreensUsingDefaults = "Đang dùng màn mặc định theo vai trò (chưa ghi đè).";
        public const string GrantScreensFlash = "Đã cập nhật phân quyền màn hình.";
        public const string GrantScreensClearsGroup =
            "Lưu tùy chọn màn hình sẽ bỏ gắn nhóm quyền trên tài khoản này.";
        public const string FormPermissionGroup = "Nhóm quyền";
        public const string FormPermissionGroupDefault = "— Chọn nhóm quyền —";
        public const string FormPermissionGroupBootstrapAdmin = "— Full quyền (admin hệ thống) —";
        public const string FormPermissionGroupHint =
            "Vai trò đăng nhập suy từ màn hình trong nhóm đã chọn.";
        public const string PermissionGroupRequired = "Vui lòng chọn nhóm quyền";
        public const string FormDept = "Đơn vị";
        public const string FormDeptPlaceholder = "— Chọn đơn vị —";
        public const string FormDeptRequired = "Vui lòng chọn đơn vị";
        public const string FormEmployee = "Nhân viên";
        public const string FormEmployeePlaceholder = "— Chọn nhân viên —";
        public const string FormEmployeeRequired = "Vui lòng chọn nhân viên";
        public const string FormEmployeeHint =
            "Chọn đơn vị trước, rồi chọn nhân viên thuộc đơn vị đó.";
        public const string FormDeptFromEmployee = "Đơn vị (theo nhân viên)";
        public const string ColPermissionGroup = "NHÓM QUYỀN";
        public const string ResetPasswordTitle = "Đặt lại mật khẩu";
        public const string ResetPasswordSubmit = "Đặt lại mật khẩu";
        public const string ResetPasswordConfirm = "Xác nhận mật khẩu mới";
        public const string ResetPasswordMinLength = "Mật khẩu mới phải có ít nhất 6 ký tự";
        public const string ResetPasswordMismatch = "Xác nhận mật khẩu không khớp";
        public const string FormUsername = "Tên đăng nhập";
        public const string FormPassword = "Mật khẩu";
        public const string FormPasswordEditHint = "Để trống nếu không đổi mật khẩu";
        public const string FormFullname = "Họ và tên";
        public const string FormRole = "Vai trò";
        public const string FormEmployeeRequiredHead = "Vui lòng chọn nhân viên cho tài khoản Trưởng đơn vị";
        public const string FormEmployeeRequiredDuty = "Vui lòng chọn nhân viên cho tài khoản Trực ban";
        public const string FormHeadDeptTaken =
            "Đơn vị này đã có tài khoản Trưởng đơn vị. Vui lòng sửa hoặc xóa tài khoản hiện có trước khi tạo mới.";
        public const string FormHeadDeptNote =
            "Mỗi đơn vị chỉ được một tài khoản Trưởng đơn vị. Muốn thay người, hãy sửa hoặc xóa tài khoản hiện có.";
        public const string FormDutyDeptNote =
            "Trực ban gắn với nhân viên và đơn vị công tác. Quyền vận hành vẫn toàn viện (Tổng quan / Chi tiết).";
        public const string FormActive = "Đang hoạt động";
        public const string UsernameRequired = "Tên đăng nhập là bắt buộc";
        public const string PasswordRequired = "Mật khẩu là bắt buộc khi tạo tài khoản";
        public const string FullnameRequired = "Họ và tên là bắt buộc";
        public const string CannotDeleteSelf = "Không thể ngưng tài khoản đang đăng nhập";
        public const string FlashCreate = "Đã thêm tài khoản thành công.";
        public const string FlashUpdate = "Đã cập nhật tài khoản thành công.";
        public const string FlashDeleteFail = "Không thể ngưng tài khoản. Vui lòng thử lại.";

        public static string DeleteMessage(string username) =>
            $"Chuyển tài khoản \"{username}\" sang ngưng hoạt động? Tài khoản sẽ không đăng nhập được nữa.";

        public static string ResetPasswordDesc(string fullname, string username) =>
            $"Đặt mật khẩu mới cho tài khoản \"{fullname}\" ({username}).";

        public static string FlashDeleteSuccess(string username) =>
            $"Đã chuyển tài khoản \"{username}\" sang ngưng hoạt động.";

        public static string FlashResetPasswordSuccess(string username) =>
            $"Đã đặt lại mật khẩu cho \"{username}\" thành công.";

        public static class Stats
        {
            public const string Total = "Tổng tài khoản";
            public const string Active = "Đang sử dụng";
            public const string Inactive = "Ngưng sử dụng";
        }
    }

    public static class PermissionGroups
    {
        public const string PageTitle = "NHÓM QUYỀN";
        public const string PageSubtitle = "Mẫu tập màn hình theo vai trò — gắn khi tạo/sửa tài khoản ở tab Tài khoản";
        public const string NewButton = "Thêm nhóm";
        public const string RoleFilterLabel = "Vai trò";
        public const string RoleAll = "Tất cả vai trò";
        public const string UnitLabel = "nhóm";
        public const string ColName = "TÊN NHÓM";
        public const string ColRole = "VAI TRÒ";
        public const string ColScreens = "SỐ MÀN";
        public const string ColAccounts = "TÀI KHOẢN";
        public const string ColStatus = "TRẠNG THÁI";
        public const string ColActions = "THAO TÁC";
        public const string ActionsMenu = "Thao tác";
        public const string Active = "Đang dùng";
        public const string Inactive = "Ngưng";
        public const string FormTitleCreate = "Thêm nhóm quyền";
        public const string FormTitleEdit = "Sửa nhóm quyền";
        public const string FormBadgeCreate = "THÊM NHÓM QUYỀN";
        public const string FormBadgeEdit = "SỬA NHÓM QUYỀN";
        public const string FormName = "Tên nhóm";
        public const string FormRole = "Phạm vi (tự suy từ màn)";
        public const string FormScreens = "Màn hình trong nhóm";
        public const string FormActive = "Đang dùng";
        public const string NameRequired = "Tên nhóm là bắt buộc";
        public const string ScreensRequired = "Chọn ít nhất một màn hình";
        public const string ScreensMixedShell =
            "Một nhóm chỉ được chọn màn của một loại tài khoản (Quản trị / Trực ban / Trưởng đơn vị).";
        public const string DeactivateTitle = "Ngưng nhóm quyền";
        public const string FlashCreate = "Đã thêm nhóm quyền.";
        public const string FlashUpdate = "Đã cập nhật nhóm quyền.";
        public const string FlashDeactivate = "Đã ngưng nhóm quyền.";
        public const string LoadError = "Không tải được danh sách nhóm quyền.";

        public static string DeactivateMessage(string name) =>
            $"Ngưng nhóm \"{name}\"? Tài khoản đang gắn nhóm sẽ về mặc định/tùy chỉnh khi đăng nhập lại nếu nhóm không còn hiệu lực.";

        public static class Stats
        {
            public const string Total = "Tổng nhóm";
            public const string Active = "Đang dùng";
            public const string Inactive = "Đã ngưng";
        }
    }

    public static class System
    {
        public const string PageTitle = "CÀI ĐẶT HỆ THỐNG";
        public const string PageSubtitle = "Thương hiệu, giờ làm việc và khóa mềm ngày công";
        public const string SectionSystemName = "1. Tên hệ thống";
        public const string SectionBranding = "2. Giao diện & thương hiệu";
        public const string SectionWorkHours = "3. Giờ làm việc hành chính";
        public const string SectionLock = "4. Khóa mềm ngày công";
        public const string PortalTitle = "Tên hiển thị";
        public const string PortalSubtitle = "Phụ đề";
        public const string TitleRequired = "Tên hệ thống không được để trống.";
        public const string SubtitleRequired = "Phụ đề không được để trống.";
        public const string Logo = "Logo hệ thống";
        public const string LogoSelected = "Đã chọn logo";
        public const string LogoRemove = "Xóa logo";
        public const string LogoPick = "Chọn logo";
        public const string LoginAvatar = "Ảnh nền đăng nhập";
        public const string LoginAvatarPick = "Tải ảnh nền đăng nhập";
        public const string LoginAvatarSelected = "Đã chọn ảnh nền";
        public const string LoginAvatarRemove = "Xóa ảnh nền đăng nhập";
        public const string WorkHoursHint =
            "Mốc chuẩn dùng cho đi trễ / về sớm. Khung nhận quét do Midpoint quyết định — đổi ca chỉ cần sửa midpoint, không sửa code.";
        public const string WorkHoursMilestoneTitle = "Mốc chuẩn";
        public const string WorkHoursMidpointTitle = "Midpoint";
        public const string MorningInOfficial = "Vào sáng";
        public const string NoonOutOfficial = "Ra trưa";
        public const string AfternoonInOfficial = "Vào chiều";
        public const string AfternoonOutOfficial = "Ra chiều";
        public const string MorningOpen = "Giờ mở cửa sáng";
        public const string Midpoint1 = "Midpoint 1";
        public const string MidpointNoon = "Midpoint trưa";
        public const string Midpoint2 = "Midpoint 2";
        public const string DayClose = "Giờ đóng cửa";
        public const string LateGraceMinutes = "Grace đi trễ";
        public const string EarlyGraceMinutes = "Grace về sớm";
        public const string LateGraceHint = "Cho phép trễ đầu giờ mà không trừ công.";
        public const string EarlyGraceHint = "Ra chiều trong khoảng này không tính về sớm.";
        public const string WindowPreview = "Khung nhận quét";
        public const string WindowMorningIn = "Vào sáng";
        public const string WindowNoonOut = "Ra trưa";
        public const string WindowAfternoonIn = "Vào chiều";
        public const string WindowAfternoonOut = "Ra chiều";
        public const string ResetWorkHours = "Đặt lại";
        public const string LockTime = "Giờ khóa mềm ngày công";
        public const string LockTimeHint =
            "Sau giờ này trưởng đơn vị không chỉnh sửa Chấm công ngày hôm nay. Admin vẫn điền giờ / clear. Không phải hạn nộp báo cáo.";
        public const string ReminderTime = "Giờ nhắc thiếu dữ liệu chấm công";
        public const string ReminderTimeHint =
            "Nhắc trưởng đơn vị các khoa còn thiếu giờ vào/ra hoặc chưa chấm (theo ngày hôm qua). Admin vẫn nhắc thủ công từ bảng điều khiển.";
        public const string LockTimeRequired = "Giờ khóa mềm không được để trống.";
        public const string ReminderTimeRequired = "Giờ nhắc nhở không được để trống.";
        public const string SaveSuccess = "Đã lưu cấu hình hệ thống thành công.";
        public const string SaveFail = "Không lưu được cấu hình. Vui lòng thử lại.";
        public const string ImageTypeError = "Chỉ chấp nhận ảnh định dạng JPG, PNG, GIF hoặc WEBP.";
        public const string ImageSizeError = "Dung lượng ảnh tối đa là 5MB. Vui lòng chọn ảnh nhỏ hơn.";
        public const string ImageReadError = "Không đọc được tệp ảnh. Vui lòng thử lại.";
    }

    public static class KioskTokens
    {
        public const string PageTitle = "QUẢN LÝ TOKEN VÂN TAY";
        public const string PageSubtitle = "Phát hành token cho máy quét WPF (BV87.exe --agent).";
        public const string Issue = "Phát hành token";
        public const string ColDept = "ĐƠN VỊ";
        public const string ColLabel = "NHÃN";
        public const string ColToken = "TOKEN";
        public const string ColAgent = "AGENT";
        public const string ColStatus = "TRẠNG THÁI";
        public const string ColCreated = "NGÀY TẠO";
        public const string ColActions = "THAO TÁC";
        public const string ActionsMenu = "Thao tác";
        public const string FilterDeptLabel = "Đơn vị";
        public const string FilterStatusLabel = "Trạng thái";
        public const string FilterAgentLabel = "Agent";
        public const string FilterStatusAll = "Tất cả trạng thái";
        public const string FilterAgentAll = "Tất cả";
        public const string FilterStatusActive = "Đang dùng";
        public const string FilterStatusRevoked = "Đã thu hồi";
        public const string FilterAgentOnline = "Online";
        public const string FilterAgentOffline = "Offline";
        public const string AgentOnline = "Online";
        public const string AgentOffline = "Offline";
        public const string TokenMissing = "—";
        public const string StatusActive = "Đang dùng";
        public const string StatusRevoked = "Đã thu hồi";
        public const string RenameLabel = "Đổi nhãn";
        public const string RenameLabelTitle = "Đổi nhãn kiosk";
        public const string RenameLabelBadge = "ĐỔI NHÃN KIOSK";
        public const string RenameLabelField = "Nhãn";
        public const string RenameLabelRequired = "Nhập nhãn (tối đa 100 ký tự).";
        public const string RenameLabelSubmit = "Lưu nhãn";
        public const string RenameLabelSuccess = "Đã cập nhật nhãn kiosk.";
        public const string IssueTitle = "Phát hành token kiosk";
        public const string IssueBadge = "PHÁT HÀNH TOKEN";
        public const string IssueSubtitle = "Sao chép token vào agent.config.json (kioskToken) cạnh BV87.exe trên máy khoa, rồi chạy BV87.exe --agent.";
        public const string DeptLabel = "Đơn vị";
        public const string DeptRequired = "Chọn đơn vị.";
        public const string LabelOptional = "Nhãn (tuỳ chọn)";
        public const string ConfirmIssue = "Phát hành";
        public const string IssueSuccess = "Đã phát hành token kiosk.";
        public const string RotateSuccess = "Đã xoay token kiosk.";
        public const string RevokeSuccess = "Đã thu hồi token kiosk.";
        public const string Revoke = "Thu hồi";
        public const string RevokeTitle = "Thu hồi token";
        public const string Rotate = "Xoay token";
        public const string RotateTitle = "Xoay token";
        public const string ConfirmRevoke = "Thu hồi token này? Agent đang dùng token sẽ mất kết nối ngay.";
        public const string ConfirmRotate =
            "Token cũ sẽ bị thu hồi. Dán token mới vào agent.config.json (kioskToken) rồi khởi động lại Agent (BV87.exe --agent).";
        public const string RotateSubmit = "Xoay token";
        public const string IssuedTitle = "Token mới — lưu vào Agent";
        public const string IssuedBadge = "TOKEN MỚI";
        public const string IssuedHint = "Sao chép vào agent.config.json (kioskToken) cạnh BV87.exe. Token cũng hiện trên danh sách khi đang dùng.";
        public const string Empty = "Chưa có token kiosk nào.";
        public const string LoadError = "Không tải được danh sách token.";
        public const string UnitLabel = "token";

        public static class Stats
        {
            public const string Total = "Tổng số token";
            public const string Active = "Đang dùng";
            public const string Revoked = "Đã thu hồi";
            public const string Online = "Agent Online";
        }
    }
}
