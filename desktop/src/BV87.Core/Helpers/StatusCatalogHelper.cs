using BV87.Core.Models.Attendance;

namespace BV87.Core.Helpers;

public static class StatusCatalogHelper
{
    private static readonly HashSet<string> FingerprintOnly = new(StringComparer.OrdinalIgnoreCase)
    {
        AttendanceStatusCodes.DiLam,
        AttendanceStatusCodes.DiTre
    };

    private static readonly HashSet<string> PostScanOverride = new(StringComparer.OrdinalIgnoreCase)
    {
        AttendanceStatusCodes.VeSom,
        AttendanceStatusCodes.NghiTruc,
        AttendanceStatusCodes.NghiTrucHalf,
        AttendanceStatusCodes.NghiTrucFull
    };

    private static readonly Dictionary<string, string> ShortLabels = new(StringComparer.OrdinalIgnoreCase)
    {
        ["NGHI_PHEP"] = "Nghỉ P",
        ["DI_HOC"] = "Đi học",
        ["DI_CONG_TAC"] = "C.tác",
        ["THAI_SAN"] = "T.sản",
        ["VE_SOM"] = "V.sớm",
        ["NGHI_TRUC"] = "N.trực",
        ["NGHI_TRUC_FULL"] = "N.trực",
        ["NGHI_TRUC_HALF"] = "½ ngày"
    };

    public static IReadOnlyList<QuickActionItem> BuildQuickActions(IEnumerable<AttendanceStatusType> items)
    {
        var list = items
            .Where(i => i.Active && i.ManualAllowed && !FingerprintOnly.Contains(i.Code))
            .Where(i => string.IsNullOrWhiteSpace(i.ParentCode))
            .Where(i => !string.Equals(i.Code, AttendanceStatusCodes.VeSom, StringComparison.OrdinalIgnoreCase))
            .OrderBy(i => i.SortOrder)
            .Select(i => new QuickActionItem
            {
                Code = i.Code,
                Label = i.Label,
                ShortLabel = ShortLabels.TryGetValue(i.Code, out var shortLabel) ? shortLabel : i.Label,
                ColorKey = i.ColorKey,
                IsPostScanOverride = PostScanOverride.Contains(i.Code)
            })
            .ToList();

        if (list.Count > 0)
        {
            return list;
        }

        return
        [
            new QuickActionItem { Code = "NGHI_PHEP", Label = "Nghỉ phép", ShortLabel = "Nghỉ P", ColorKey = "red" },
            new QuickActionItem { Code = "DI_HOC", Label = "Đi học", ShortLabel = "Đi học", ColorKey = "yellow" },
            new QuickActionItem { Code = "DI_CONG_TAC", Label = "Công tác", ShortLabel = "C.tác", ColorKey = "blue" },
            new QuickActionItem { Code = "THAI_SAN", Label = "Thai sản", ShortLabel = "T.sản", ColorKey = "purple" }
        ];
    }

    public static bool CanApplyQuickAction(
        StaffAttendanceRow staff,
        QuickActionItem action,
        bool tableDisabled,
        bool incompleteExplainAllowed = false)
    {
        if (tableDisabled)
        {
            return false;
        }

        if (incompleteExplainAllowed && staff.IsComplete)
        {
            return false;
        }

        if (staff.HasFingerprintPresence && !action.IsPostScanOverride)
        {
            return false;
        }

        return true;
    }

    /// <summary>Admin dept detail — may overwrite fingerprint presence via catalog quick actions.</summary>
    public static bool CanApplyQuickActionAdmin(StaffAttendanceRow staff, QuickActionItem action, bool tableDisabled) =>
        !tableDisabled;
}
