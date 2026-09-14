namespace BV87.Core.Helpers;

/// <summary>Default work-hours values — parity frontend useSystemSettings.js WORK_HOURS_DEFAULTS.</summary>
public static class WorkHoursDefaults
{
    public const string MorningInOfficial = "07:00";
    public const string NoonOutOfficial = "11:00";
    public const string AfternoonInOfficial = "13:30";
    public const string AfternoonOutOfficial = "16:30";
    public const string MorningOpen = "05:00";
    public const string Midpoint1 = "09:00";
    public const string MidpointNoon = "12:16";
    public const string Midpoint2 = "15:00";
    public const string DayClose = "21:00";
    public const int LateGraceMinutes = 5;
    public const int EarlyGraceMinutes = 5;
    public const string DefaultLockTime = "16:00";
    public const string DefaultReminderTime = "08:00";
}
