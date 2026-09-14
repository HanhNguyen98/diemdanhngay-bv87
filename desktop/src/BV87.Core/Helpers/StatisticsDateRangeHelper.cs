using BV87.Core.Constants;

namespace BV87.Core.Helpers;

/// <summary>Date range presets for HEAD statistics — mirror frontend getStatisticsDateRange.</summary>
public static class StatisticsDateRangeHelper
{
    public const int MaxRangeDays = 366;

    public static (DateOnly From, DateOnly To) GetDefaultRange() =>
        GetRange(HeadUiStrings.Statistics.PresetThisMonth, AttendanceFormatHelper.TodayVietnam());

    public static (DateOnly From, DateOnly To) GetRange(string preset, DateOnly refDate) =>
        preset switch
        {
            HeadUiStrings.Statistics.PresetThisWeek => WeekRange(refDate),
            HeadUiStrings.Statistics.PresetLastMonth => MonthRange(refDate.AddMonths(-1).Year, refDate.AddMonths(-1).Month),
            HeadUiStrings.Statistics.PresetLast30Days => (refDate.AddDays(-29), refDate),
            _ => MonthRange(refDate.Year, refDate.Month)
        };

    public static int DaysInclusive(DateOnly from, DateOnly to) => to.DayNumber - from.DayNumber + 1;

    private static (DateOnly From, DateOnly To) MonthRange(int year, int month)
    {
        var from = new DateOnly(year, month, 1);
        var to = from.AddMonths(1).AddDays(-1);
        return (from, to);
    }

    private static (DateOnly From, DateOnly To) WeekRange(DateOnly refDate)
    {
        var dayOfWeek = (int)refDate.DayOfWeek;
        var mondayOffset = dayOfWeek == 0 ? -6 : 1 - dayOfWeek;
        var from = refDate.AddDays(mondayOffset);
        return (from, from.AddDays(6));
    }
}
