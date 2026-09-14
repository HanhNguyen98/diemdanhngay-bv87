using System.Windows;
using BV87.App.ViewModels;
using BV87.App.Views.Admin;
using BV87.App.Views.Admin.Catalog;
using BV87.App.Views.Admin.Utilities;
using BV87.App.Views.Attendance;
using BV87.App.Views.Head;
using BV87.App.Views.Settings;

namespace BV87.App.Shell;

/// <summary>Maps module dialogs to Segoe MDL2 glyphs for Window.Icon (D-UI.35).</summary>
public static class DialogWindowIcons
{
    public static string GetGlyph(Window window) => window switch
    {
        ManualRangeDialog or ManualScheduleDialog => ShellNavIcons.GetGlyph("attendance"),
        NghiTrucAssignDialog => "\uE708",
        SimpleInputDialog => "\uE70F",
        ScanLogDialog => ShellNavIcons.GetGlyph("audit-logs"),
        FillAttendanceTimesDialog => "\uE823",
        ApprovePayrollFillDialog => "\uE73E",
        ClearAttendanceDialog => "\uE74D",
        ReminderDialog => ShellNavIcons.GetGlyph("reminder-history"),
        StaffAvatarDialog => "\uE77B",
        StaffCatalogFormDialog or StaffTransferDialog or StaffTransferHistoryDialog =>
            ShellNavIcons.GetGlyph("staff"),
        DepartmentCatalogFormDialog or DepartmentGroupFormDialog or DepartmentGroupManageDialog =>
            ShellNavIcons.GetGlyph("departments"),
        StaffAttributeCatalogFormDialog form => form.Kind == StaffAttributeCatalogKind.Rank
            ? ShellNavIcons.GetGlyph("ranks")
            : ShellNavIcons.GetGlyph("positions"),
        AttendanceStatusCatalogFormDialog => ShellNavIcons.GetGlyph("statuses"),
        FingerLabelDialog => ShellNavIcons.GetGlyph("fingerprint-enroll"),
        KioskTokenIssueDialog or KioskTokenIssuedDialog or KioskTokenLabelDialog =>
            ShellNavIcons.GetGlyph("settings-kiosk"),
        AccountFormDialog => ShellNavIcons.GetGlyph("settings-permissions"),
        ResetPasswordDialog => ShellNavIcons.GetGlyph("password"),
        UnlockRejectDialog => ShellNavIcons.GetGlyph("unlock-requests"),
        _ => ShellNavIcons.GetGlyph("_")
    };
}
