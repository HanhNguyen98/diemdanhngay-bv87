using BV87.App.Toasts;
using BV87.Core.Constants;
using BV87.Core.Excel;
using BV87.Core.Models.Attendance;

namespace BV87.App.Helpers;

/// <summary>Shell toast after mutations — SPEC D-UI.17 / D-ATT.2.</summary>
public static class ShellToast
{
    public static void Success(string? message)
    {
        if (!string.IsNullOrWhiteSpace(message))
        {
            App.Toasts.ShowSuccess(message);
        }
    }

    public static void Warning(string? message)
    {
        if (!string.IsNullOrWhiteSpace(message))
        {
            App.Toasts.ShowWarning(message);
        }
    }

    public static void Danger(string? message)
    {
        if (!string.IsNullOrWhiteSpace(message))
        {
            App.Toasts.ShowDanger(message);
        }
    }

    public static void FromRangeResult(
        ManualAttendanceRangeResult result,
        string staffName,
        string statusLabel)
    {
        var label = string.IsNullOrWhiteSpace(result.StatusLabel) ? statusLabel : result.StatusLabel;
        if (result.SkipCount > 0)
        {
            Warning(AttendanceUiStrings.FormatManualRangeWarning(
                staffName, label, result.UpdatedCount, result.SkippedFingerprint, result.SkippedSoftLock));
            return;
        }

        Success(AttendanceUiStrings.FormatManualRangeSuccess(staffName, label, result.UpdatedCount));
    }

    public static void FromImport(ExcelImportRunResult result)
    {
        if (!string.IsNullOrWhiteSpace(result.ErrorMessage))
        {
            Danger(result.ErrorMessage);
            return;
        }

        if (result.IsWarning)
        {
            Warning(result.StatusMessage);
            return;
        }

        Success(result.StatusMessage);
    }
}
