using BV87.Core.Constants;
using BV87.Core.Models.Attendance;

namespace BV87.Core.Helpers;

/// <summary>Admin dept-detail row action eligibility — mirror frontend/constants/attendance.js.</summary>
public static class AttendanceActionHelper
{
    private const int NghiTrucWizardMaxRangeDays = 366;
    public static bool IsPayrollFillPending(StaffAttendanceRow? staff) =>
        string.Equals(staff?.PayrollFillStatus, "PENDING", StringComparison.OrdinalIgnoreCase);

    public static bool IsNghiTrucStatus(string? status) =>
        string.Equals(status, AttendanceStatusCodes.NghiTrucHalf, StringComparison.OrdinalIgnoreCase)
        || string.Equals(status, AttendanceStatusCodes.NghiTrucFull, StringComparison.OrdinalIgnoreCase);

    public static bool CanAdminApprovePayrollFill(StaffAttendanceRow? staff) =>
        staff != null && IsPayrollFillPending(staff) && IsNghiTrucStatus(staff.Status);

    public static bool HasEmptyFourPunchSlot(StaffAttendanceRow? staff)
    {
        if (staff == null)
        {
            return true;
        }

        var morning = staff.MorningInAt ?? staff.CheckInAt;
        var afternoonOut = staff.AfternoonOutAt ?? (staff.NoonOutAt == null ? staff.CheckOutAt : null);
        return morning == null || staff.NoonOutAt == null || staff.AfternoonInAt == null || afternoonOut == null;
    }

    public static bool CanAdminFillTimes(StaffAttendanceRow? staff)
    {
        if (staff == null)
        {
            return false;
        }

        if (CanAdminApprovePayrollFill(staff))
        {
            return false;
        }

        var isManualLeave = !string.IsNullOrWhiteSpace(staff.Status)
            && !string.Equals(staff.Status, AttendanceStatusCodes.DiLam, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(staff.Status, AttendanceStatusCodes.DiTre, StringComparison.OrdinalIgnoreCase);
        if (isManualLeave)
        {
            return false;
        }

        if (!HasEmptyFourPunchSlot(staff))
        {
            return false;
        }

        return !string.IsNullOrWhiteSpace(staff.MissingPunchReason);
    }

    public static bool CanClearAttendance(StaffAttendanceRow? staff) =>
        staff != null && (
            !string.IsNullOrWhiteSpace(staff.Status)
            || staff.CheckInAt != null
            || staff.CheckOutAt != null
            || staff.MorningInAt != null
            || staff.NoonOutAt != null
            || staff.AfternoonInAt != null
            || staff.AfternoonOutAt != null);

    public static string FormatScanDirection(string? direction) =>
        direction switch
        {
            "IN" => "Vào",
            "MORNING_IN" => "Vào sáng",
            "NOON_OUT" => "Ra trưa",
            "AFTERNOON_IN" => "Vào chiều",
            "AFTERNOON_OUT" => "Ra chiều",
            "OUT" => "Ra",
            "REJECTED" => "Từ chối",
            _ => direction ?? "—"
        };

    /// <summary>N.truc wizard when punch count is 0–3 — includes HEAD marking before employee scans.</summary>
    public static bool NeedsNghiTrucWizard(StaffAttendanceRow? staff) =>
        staff != null && staff.PunchCount < 4;

    public static bool IsPostScanOverrideAction(QuickActionItem? action) =>
        action?.IsPostScanOverride == true;

    public static bool HasPunchTimes(StaffAttendanceRow staff) =>
        staff.MorningInAt != null
        || staff.NoonOutAt != null
        || staff.AfternoonInAt != null
        || staff.AfternoonOutAt != null;

    public static string ResolveInitialPayrollIntent(StaffAttendanceRow staff, bool hasPunches)
    {
        var currentIntent = staff.PayrollIntent;
        if (string.Equals(currentIntent, PayrollIntentCodes.HalfAfternoon, StringComparison.OrdinalIgnoreCase))
        {
            return currentIntent!;
        }

        if (!hasPunches
            && string.Equals(currentIntent, PayrollIntentCodes.NghiTrucFull, StringComparison.OrdinalIgnoreCase))
        {
            return PayrollIntentCodes.NghiTrucFull;
        }

        return hasPunches ? PayrollIntentCodes.HalfAfternoon : PayrollIntentCodes.NghiTrucFull;
    }

    public static IReadOnlyList<NghiTrucWizardOption> GetNghiTrucWizardOptions(bool hasPunches)
    {
        var options = new List<NghiTrucWizardOption>
        {
            new() { PayrollIntent = PayrollIntentCodes.HalfAfternoon, Label = AttendanceUiStrings.NghiTrucIntentHalfAfternoon },
            new() { PayrollIntent = PayrollIntentCodes.NghiTrucFull, Label = AttendanceUiStrings.NghiTrucIntentFull }
        };

        if (hasPunches)
        {
            return options.Where(o => !string.Equals(o.PayrollIntent, PayrollIntentCodes.NghiTrucFull, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        return options;
    }

    public static string? ResolveNghiTrucSubtitle(StaffAttendanceRow? staff)
    {
        if (staff == null || !IsNghiTrucStatus(staff.Status))
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(staff.NghiTrucSubtitle))
        {
            return staff.NghiTrucSubtitle;
        }

        if (string.Equals(staff.PayrollIntent, PayrollIntentCodes.HalfAfternoon, StringComparison.OrdinalIgnoreCase))
        {
            return AttendanceUiStrings.NghiTrucSubtitleHalfAfternoon;
        }

        if (string.Equals(staff.PayrollIntent, PayrollIntentCodes.NghiTrucFull, StringComparison.OrdinalIgnoreCase)
            || string.Equals(staff.Status, AttendanceStatusCodes.NghiTrucFull, StringComparison.OrdinalIgnoreCase))
        {
            return AttendanceUiStrings.NghiTrucSubtitleFull;
        }

        if (string.Equals(staff.PayrollIntent, PayrollIntentCodes.HalfMorning, StringComparison.OrdinalIgnoreCase))
        {
            return AttendanceUiStrings.NghiTrucSubtitleHalfMorning;
        }

        if (string.Equals(staff.Status, AttendanceStatusCodes.NghiTrucHalf, StringComparison.OrdinalIgnoreCase))
        {
            return AttendanceUiStrings.NghiTrucSubtitleHalfAfternoon;
        }

        return null;
    }

    public static string ResolveNghiTrucIntentLabel(string? payrollIntent)
    {
        if (string.Equals(payrollIntent, PayrollIntentCodes.NghiTrucFull, StringComparison.OrdinalIgnoreCase))
        {
            return AttendanceUiStrings.NghiTrucIntentFull;
        }

        if (string.Equals(payrollIntent, PayrollIntentCodes.HalfAfternoon, StringComparison.OrdinalIgnoreCase))
        {
            return AttendanceUiStrings.NghiTrucIntentHalfAfternoon;
        }

        return string.Empty;
    }

    public static int DaysInclusive(DateOnly from, DateOnly to) => to.DayNumber - from.DayNumber + 1;

    public static string? ValidateNghiTrucWizardRequest(string? payrollIntent, string? reason, DateOnly? from, DateOnly? to)
    {
        if (string.IsNullOrWhiteSpace(payrollIntent))
        {
            return AttendanceUiStrings.NghiTrucWizardNeedIntent;
        }

        if (string.Equals(payrollIntent, PayrollIntentCodes.HalfMorning, StringComparison.OrdinalIgnoreCase))
        {
            return "Không còn chấm nghỉ trực nửa buổi sáng. Chọn nghỉ trực 1 ngày hoặc nửa buổi chiều.";
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            return AttendanceUiStrings.NghiTrucWizardNeedReason;
        }

        if (from == null || to == null)
        {
            return AttendanceUiStrings.NghiTrucWizardNeedDates;
        }

        if (to.Value < from.Value)
        {
            return AttendanceUiStrings.ManualRangeInvalidOrder;
        }

        if (DaysInclusive(from.Value, to.Value) > NghiTrucWizardMaxRangeDays)
        {
            return AttendanceUiStrings.ManualRangeTooLong;
        }

        return null;
    }
}
