using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Attendance;

namespace BV87.App.Helpers;

/// <summary>Maps nghi-truc wizard API result to shell toast — SPEC D-ATT.2 / D-UI.18.</summary>
public static class NghiTrucWizardFeedback
{
    public static void ShowResult(ManualAttendanceRangeResult result, StaffAttendanceRow staff, string payrollIntent)
    {
        var intentLabel = AttendanceActionHelper.ResolveNghiTrucIntentLabel(payrollIntent);
        if (result.SkipCount > 0)
        {
            App.Toasts.ShowWarning(AttendanceUiStrings.FormatNghiTrucToastWarning(
                staff.Fullname,
                intentLabel,
                result.UpdatedCount,
                result.SkippedFingerprint,
                result.SkippedSoftLock));
            return;
        }

        App.Toasts.ShowSuccess(AttendanceUiStrings.FormatNghiTrucToastSuccess(staff.Fullname, intentLabel));
    }

    public static void ShowFailure(string staffName)
    {
        App.Toasts.ShowDanger(AttendanceUiStrings.FormatNghiTrucToastFail(staffName));
    }
}
