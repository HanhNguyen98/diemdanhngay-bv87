using BV87.Core.Models.Attendance;

namespace BV87.Core.Helpers;

public static class AttendanceFormatHelper
{
    private static readonly TimeZoneInfo VietnamZone =
        TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");

    public static string FormatPunchTimes(StaffAttendanceRow staff)
    {
        var parts = new List<string>();
        AppendClock(parts, staff.MorningInAt);
        AppendClock(parts, staff.NoonOutAt);
        AppendClock(parts, staff.AfternoonInAt);
        AppendClock(parts, staff.AfternoonOutAt);
        return parts.Count == 0 ? "—" : string.Join(" · ", parts);
    }

    /// <summary>Read-only clock: 00–23 with AM/PM (e.g. 07:00 AM, 13:00 PM). SPEC D-UI.54.</summary>
    /// <param name="hour">Hour of day 0–23.</param>
    /// <param name="minute">Minute 0–59.</param>
    /// <returns>Vietnamese UI clock text with AM or PM suffix.</returns>
    public static string FormatClockMeridiem(int hour, int minute)
    {
        hour = Math.Clamp(hour, 0, 23);
        minute = Math.Clamp(minute, 0, 59);
        var suffix = hour < 12 ? "AM" : "PM";
        return $"{hour:D2}:{minute:D2} {suffix}";
    }

    /// <summary>Vietnam local punch time for grid/wizard. Empty instant → —.</summary>
    public static string FormatClockDisplay(DateTimeOffset? instant)
    {
        if (instant == null)
        {
            return "—";
        }

        var local = TimeZoneInfo.ConvertTime(instant.Value, VietnamZone);
        return FormatClockMeridiem(local.Hour, local.Minute);
    }

    /// <summary>Input / API slot text — HH:mm without meridiem.</summary>
    public static string FormatInstant(DateTimeOffset? instant)
    {
        if (instant == null)
        {
            return "—";
        }

        var local = TimeZoneInfo.ConvertTime(instant.Value, VietnamZone);
        return local.ToString("HH:mm");
    }

    public static DateOnly TodayVietnam()
    {
        var local = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, VietnamZone);
        return DateOnly.FromDateTime(local.DateTime);
    }

    public static IReadOnlyList<DateOnly> RecentDates(int count)
    {
        var today = TodayVietnam();
        return Enumerable.Range(0, count).Select(i => today.AddDays(-i)).ToList();
    }

    public static string ToApiDate(DateOnly date) => date.ToString("yyyy-MM-dd");

    public static string FormatKioskMachine(StaffAttendanceRow staff)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(staff.LastKioskLabel))
        {
            parts.Add(staff.LastKioskLabel.Trim());
        }

        if (!string.IsNullOrWhiteSpace(staff.LastKioskHostname))
        {
            parts.Add(staff.LastKioskHostname.Trim());
        }

        if (!string.IsNullOrWhiteSpace(staff.LastKioskIp))
        {
            parts.Add(staff.LastKioskIp.Trim());
        }

        return parts.Count == 0 ? "—" : string.Join(" · ", parts.Distinct(StringComparer.OrdinalIgnoreCase));
    }

    public static string FormatKioskMachineParts(string? label, string? hostname, string? ip)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(label))
        {
            parts.Add(label.Trim());
        }

        if (!string.IsNullOrWhiteSpace(hostname))
        {
            parts.Add(hostname.Trim());
        }

        if (!string.IsNullOrWhiteSpace(ip))
        {
            parts.Add(ip.Trim());
        }

        return parts.Count == 0 ? string.Empty : string.Join(" · ", parts.Distinct(StringComparer.OrdinalIgnoreCase));
    }

    public static string FormatInstantHm(DateTimeOffset? instant) =>
        instant == null ? string.Empty : FormatClockDisplay(instant);

    private static void AppendClock(List<string> parts, DateTimeOffset? instant)
    {
        if (instant == null)
        {
            return;
        }

        parts.Add(FormatClockDisplay(instant));
    }
}
