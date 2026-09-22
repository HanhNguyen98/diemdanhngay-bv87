using BV87.Core;
using BV87.Core.Constants;

namespace BV87.App.Shell;

public static class ShellNavigation
{
    public static IReadOnlyList<ShellNavGroup> GetNavGroups(AppMode mode) =>
        GetNavGroups(mode, screenCodes: null);

    /// <summary>
    /// Builds sidebar for mode, filtered by effective screen ACL codes (SPEC_DUTY §7).
    /// Null/empty codes → role default nav (backward compatible).
    /// </summary>
    public static IReadOnlyList<ShellNavGroup> GetNavGroups(
        AppMode mode,
        IReadOnlyCollection<string>? screenCodes)
    {
        var baseGroups = mode switch
        {
            AppMode.Head => GetHeadNavGroups(),
            AppMode.Admin => GetAdminNavGroups(),
            AppMode.Duty => GetDutyNavGroups(),
            _ => new List<ShellNavGroup> { new() { Items = GetHeadNavItemsFlat() } }
        };

        if (screenCodes == null || screenCodes.Count == 0)
        {
            return baseGroups;
        }

        var codeSet = new HashSet<string>(screenCodes, StringComparer.OrdinalIgnoreCase);
        var filtered = FilterGroups(baseGroups, mode, codeSet).ToList();

        if (mode == AppMode.Duty)
        {
            AppendDutyGrantedUtilities(filtered, codeSet);
        }

        return filtered.Where(g => g.Items.Count > 0).ToList();
    }

    public static IReadOnlyList<ShellNavItem> GetNavItems(AppMode mode) =>
        GetNavGroups(mode).SelectMany(g => g.Items).ToList();

    public static string ScreenCodeFor(AppMode mode, string navId) =>
        mode switch
        {
            AppMode.Admin => $"admin.{navId}",
            AppMode.Head => $"head.{navId}",
            AppMode.Duty => $"duty.{navId}",
            _ => navId
        };

    private static IEnumerable<ShellNavGroup> FilterGroups(
        IReadOnlyList<ShellNavGroup> groups,
        AppMode mode,
        HashSet<string> codes)
    {
        foreach (var group in groups)
        {
            var items = group.Items
                .Where(i => codes.Contains(ScreenCodeFor(mode, i.Id)))
                .ToList();
            yield return new ShellNavGroup
            {
                Title = group.Title,
                Items = items
            };
        }
    }

    private static void AppendDutyGrantedUtilities(List<ShellNavGroup> groups, HashSet<string> codes)
    {
        var extras = new List<ShellNavItem>();
        if (codes.Contains("admin.unlock-requests"))
        {
            extras.Add(Nav("unlock-requests", "Yêu cầu mở khóa", "Yêu cầu mở khóa", "Duyệt yêu cầu mở khóa HEAD."));
        }

        if (codes.Contains("admin.audit-logs"))
        {
            extras.Add(Nav("audit-logs", "Nhật ký chỉnh sửa", "Nhật ký chỉnh sửa", "Audit log chấm công."));
        }

        if (codes.Contains("admin.fingerprint-history"))
        {
            extras.Add(Nav("fingerprint-history", "Lịch sử vân tay", "Lịch sử vân tay", "Nhật ký mẫu vân tay."));
        }

        if (codes.Contains("admin.reminder-history"))
        {
            extras.Add(Nav("reminder-history", "Lịch sử nhắc nhở", "Lịch sử nhắc nhở", "Lịch sử gửi nhắc nhở."));
        }

        if (extras.Count == 0)
        {
            return;
        }

        groups.Add(new ShellNavGroup
        {
            Title = AdminUiStrings.NavUtilities,
            Items = extras
        });
    }

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
                Nav("settings-permissions", "Phân quyền", "Phân quyền", "Tài khoản và nhóm quyền màn hình — D-ACL."),
                Nav("settings-kiosk", "Token Kiosk", "Token Kiosk", "Cấu hình token kiosk — phase D4."),
                Nav("settings-system", "Hệ thống", "Cài đặt hệ thống", "Khóa sổ, giờ làm việc — phase D4."),
                Nav("password", "Đổi mật khẩu", "Đổi mật khẩu", "Đổi mật khẩu tài khoản ADMIN — phase D4.")
            ]
        }
    ];

    private static IReadOnlyList<ShellNavGroup> GetDutyNavGroups() =>
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
            Items =
            [
                Nav("password", "Đổi mật khẩu", "Đổi mật khẩu", "Đổi mật khẩu tài khoản Trực ban.")
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
        AppMode.Duty => "Trực ban bệnh viện",
        _ => "BV87"
    };
}
