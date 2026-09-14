using BV87.Core;
using BV87.Core.Constants;

namespace BV87.App.Shell;

public static class ShellNavigation
{
    public static IReadOnlyList<ShellNavGroup> GetNavGroups(AppMode mode) => mode switch
    {
        AppMode.Head => GetHeadNavGroups(),
        AppMode.Admin => GetAdminNavGroups(),
        _ =>
        [
            new ShellNavGroup { Items = GetHeadNavItemsFlat() }
        ]
    };

    public static IReadOnlyList<ShellNavItem> GetNavItems(AppMode mode) =>
        GetNavGroups(mode).SelectMany(g => g.Items).ToList();

    private static IReadOnlyList<ShellNavItem> GetHeadNavItemsFlat() =>
    [
        Nav("attendance", "Chấm công", "Chấm công", "Bảng nhân viên và ghi trạng thái theo ngày."),
        Nav("statistics", "Thống kê", "Thống kê", "KPI và lịch sử chấm công đơn vị."),
        Nav("staff", "Nhân viên", "Danh mục nhân viên", "Xem và xóa vân tay nhân viên đơn vị."),
        Nav("fingerprint-enroll", "Đăng ký vân tay", "Đăng ký vân tay", "Đăng ký vân tay USB ZK9500 — D1.1."),
        Nav("password", "Đổi mật khẩu", "Đổi mật khẩu", "Đổi mật khẩu tài khoản HEAD.")
    ];

    public static IReadOnlyList<ShellNavGroup> GetHeadNavGroups()
    {
        var items = GetHeadNavItemsFlat();
        return
        [
            new ShellNavGroup { Items = items.Where(i => i.Id is "attendance" or "statistics" or "staff").ToList() },
            new ShellNavGroup
            {
                Title = HeadUiStrings.NavUtilities,
                Items = items.Where(i => i.Id == "fingerprint-enroll").ToList()
            },
            new ShellNavGroup { Items = items.Where(i => i.Id == "password").ToList() }
        ];
    }

    private static IReadOnlyList<ShellNavGroup> GetAdminNavGroups() =>
    [
        new ShellNavGroup
        {
            Title = AdminUiStrings.NavDashboard,
            Items =
            [
                Nav("dashboard-overview", "Tổng quan chung", "Tổng quan chung", "KPI và tiến độ chấm công toàn viện."),
                Nav("dashboard-dept", "Chi tiết đơn vị", "Chi tiết đơn vị", "Roster chấm công theo khoa và ngày.")
            ]
        },
        new ShellNavGroup
        {
            Title = AdminUiStrings.NavCatalog,
            Items =
            [
                Nav("departments", "Đơn vị", "Danh mục đơn vị", "Quản lý phòng ban — phase D4."),
                Nav("staff", "Nhân viên", "Danh mục nhân viên", "Quản lý nhân viên toàn viện — phase D4."),
                Nav("ranks", "Cấp bậc", "Danh mục cấp bậc", "Quản lý cấp bậc — phase D4."),
                Nav("positions", "Chức vụ", "Danh mục chức vụ", "Quản lý chức vụ — phase D4."),
                Nav("statuses", "Trạng thái chấm công", "Trạng thái chấm công", "Quản lý trạng thái — phase D4.")
            ]
        },
        new ShellNavGroup
        {
            Title = AdminUiStrings.NavUtilities,
            Items =
            [
                Nav("unlock-requests", "Yêu cầu mở khóa", "Yêu cầu mở khóa", "Duyệt yêu cầu mở khóa HEAD — phase D4."),
                Nav("audit-logs", "Nhật ký chỉnh sửa", "Nhật ký chỉnh sửa", "Audit log chấm công — phase D4."),
                Nav("fingerprint-history", "Lịch sử vân tay", "Lịch sử vân tay", "Nhật ký đăng ký / xóa mẫu vân tay — phase D4."),
                Nav("fingerprint-enroll", "Đăng ký vân tay", "Đăng ký vân tay", "Đăng ký vân tay USB ZK9500 — D1.1."),
                Nav("reminder-history", "Lịch sử nhắc nhở", "Lịch sử nhắc nhở", "Lịch sử gửi nhắc nhở — phase D4.")
            ]
        },
        new ShellNavGroup
        {
            Title = AdminUiStrings.NavSettings,
            Items =
            [
                Nav("settings-permissions", "Phân quyền", "Phân quyền", "Quản lý tài khoản ADMIN/HEAD — phase D4."),
                Nav("settings-kiosk", "Token Kiosk", "Token Kiosk", "Cấu hình token kiosk — phase D4."),
                Nav("settings-system", "Hệ thống", "Cài đặt hệ thống", "Khóa sổ, giờ làm việc — phase D4."),
                Nav("password", "Đổi mật khẩu", "Đổi mật khẩu", "Đổi mật khẩu tài khoản ADMIN — phase D4.")
            ]
        }
    ];

    private static ShellNavItem Nav(string id, string label, string title, string description) => new()
    {
        Id = id,
        Label = label,
        PlaceholderTitle = title,
        PlaceholderDescription = description
    };

    public static string GetModeTitle(AppMode mode) => mode switch
    {
        AppMode.Head => "Trưởng đơn vị",
        AppMode.Admin => "Quản trị viên",
        _ => "BV87"
    };
}
