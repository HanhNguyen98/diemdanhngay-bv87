using BV87.Core.Models.Attendance;

namespace BV87.Core.Helpers;

/// <summary>
/// Day-record completeness — mirror frontend isAttendanceComplete / AttendanceValidity.isComplete.
/// </summary>
public static class AttendanceCompleteness
{
    public static bool IsComplete(StaffAttendanceRow? staff)
    {
        if (staff == null || string.IsNullOrWhiteSpace(staff.Status))
        {
            return false;
        }

        if (AttendanceActionHelper.IsPayrollFillPending(staff))
        {
            return false;
        }

        if (string.Equals(staff.Status, AttendanceStatusCodes.NghiTrucHalf, StringComparison.OrdinalIgnoreCase))
        {
            if (string.Equals(staff.PayrollFillStatus, "APPROVED", StringComparison.OrdinalIgnoreCase))
            {
                return staff.PunchCount == 4
                    || IsLegacyTwoPunchComplete(staff)
                    || IsHalfMorningPattern(staff)
                    || IsHalfAfternoonPattern(staff);
            }

            return IsHalfMorningPattern(staff) || IsHalfAfternoonPattern(staff);
        }

        if (string.Equals(staff.Status, AttendanceStatusCodes.NghiTrucFull, StringComparison.OrdinalIgnoreCase))
        {
            return !string.Equals(staff.PayrollFillStatus, "PENDING", StringComparison.OrdinalIgnoreCase);
        }

        if (string.Equals(staff.Status, AttendanceStatusCodes.VeSom, StringComparison.OrdinalIgnoreCase))
        {
            return staff.PunchCount == 4 && !string.IsNullOrWhiteSpace(staff.Note);
        }

        if (string.Equals(staff.Status, AttendanceStatusCodes.DiLam, StringComparison.OrdinalIgnoreCase)
            || string.Equals(staff.Status, AttendanceStatusCodes.DiTre, StringComparison.OrdinalIgnoreCase))
        {
            if (staff.PunchCount == 4)
            {
                return true;
            }

            if (IsLegacyTwoPunchComplete(staff))
            {
                return true;
            }

            return staff.PunchCount == 0 && staff.CheckInAt != null && staff.CheckOutAt != null;
        }

        return true;
    }

    public static bool IsLegacyTwoPunchComplete(StaffAttendanceRow? staff) =>
        staff != null
        && staff.MorningInAt != null
        && staff.AfternoonOutAt != null
        && staff.NoonOutAt == null
        && staff.AfternoonInAt == null;

    public static bool IsHalfMorningPattern(StaffAttendanceRow? staff) =>
        staff != null
        && staff.MorningInAt != null
        && staff.NoonOutAt != null
        && staff.AfternoonInAt == null
        && staff.AfternoonOutAt == null;

    public static bool IsHalfAfternoonPattern(StaffAttendanceRow? staff) =>
        staff != null
        && staff.MorningInAt == null
        && staff.NoonOutAt == null
        && staff.AfternoonInAt != null
        && staff.AfternoonOutAt != null;
}
