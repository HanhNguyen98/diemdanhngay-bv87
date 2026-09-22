using BV87.Core.Constants;
using BV87.Core.Helpers;

namespace BV87.Core.Models.Attendance;

public sealed class StaffAttendanceRow : IPageRowNumber
{
    public long? RecordId { get; set; }
    public int EmpCode { get; set; }
    public string? EmpCodeFormatted { get; set; }
    public string Fullname { get; set; } = string.Empty;
    public int? DeptCode { get; set; }
    public string? DeptCodeFormatted { get; set; }
    public string DeptDisplay { get; set; } = string.Empty;
    public string? RankName { get; set; }
    public string? PositionName { get; set; }
    public string? Status { get; set; }
    public string? StatusLabel { get; set; }
    public string? Note { get; set; }
    public string? MissingPunchReason { get; set; }
    public string? PayrollIntent { get; set; }
    public string? PayrollIntentLabel { get; set; }
    public string? NghiTrucSubtitle { get; set; }
    public string? PayrollFillStatus { get; set; }
    public string? PayrollFillStatusLabel { get; set; }
    public DateTimeOffset? CheckInAt { get; set; }
    public DateTimeOffset? CheckOutAt { get; set; }
    public DateTimeOffset? MorningInAt { get; set; }
    public DateTimeOffset? NoonOutAt { get; set; }
    public DateTimeOffset? AfternoonInAt { get; set; }
    public DateTimeOffset? AfternoonOutAt { get; set; }
    public bool LateFlag { get; set; }
    public string? LastKioskLabel { get; set; }
    public string? LastKioskHostname { get; set; }
    public string? LastKioskIp { get; set; }
    public string? Source { get; set; }

    /// <summary>API D-DATA.1 — null on older payloads; then client fallback.</summary>
    public bool? Complete { get; set; }

    public int RowNumber { get; set; }

    public int PunchCount =>
        (MorningInAt != null ? 1 : 0)
        + (NoonOutAt != null ? 1 : 0)
        + (AfternoonInAt != null ? 1 : 0)
        + (AfternoonOutAt != null ? 1 : 0);

    public bool IsBlank => string.IsNullOrWhiteSpace(Status);
    public bool IsComplete => Complete ?? AttendanceCompleteness.IsComplete(this);
    public bool IsUnchecked => !IsComplete;
    public bool HasFingerprintPresence =>
        string.Equals(Status, AttendanceStatusCodes.DiLam, StringComparison.OrdinalIgnoreCase)
        || string.Equals(Status, AttendanceStatusCodes.DiTre, StringComparison.OrdinalIgnoreCase);

    public string DisplayTimes => AttendanceFormatHelper.FormatPunchTimes(this);
    public string DisplayMachine => AttendanceFormatHelper.FormatKioskMachine(this);
    public string? DisplayNghiTrucSubtitle => AttendanceActionHelper.ResolveNghiTrucSubtitle(this);
    public string DisplayStatus => AttendanceActionHelper.IsNghiTrucStatus(Status)
        ? AttendanceUiStrings.NghiTrucBadge
        : string.IsNullOrWhiteSpace(StatusLabel)
            ? (IsBlank ? "Chưa chấm" : Status ?? "—")
            : StatusLabel;
}
