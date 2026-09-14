using System.Globalization;
using System.Net;
using System.Net.Sockets;
using BV87.Core.Helpers;

namespace BV87.App.Helpers;

/// <summary>Format helpers for admin utilities — parity Web formatLogDateTime / displayIp / defaultReminderHistoryRange.</summary>
public static class AdminUtilitiesFormatHelper
{
    public static (DateOnly From, DateOnly To) DefaultHistoryRange(DateOnly? refDate = null)
    {
        var today = refDate ?? DateOnly.FromDateTime(DateTime.Today);
        return (new DateOnly(today.Year, today.Month, 1), today);
    }

    public static string FormatLogDateTime(DateTime? value)
    {
        if (value == null)
        {
            return string.Empty;
        }

        var local = value.Value.Kind switch
        {
            DateTimeKind.Utc => value.Value.ToLocalTime(),
            _ => value.Value
        };

        return $"{local.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture)} {AttendanceFormatHelper.FormatClockMeridiem(local.Hour, local.Minute)}";
    }

    public static string FormatLogDateTimeOrDash(DateTime? value) =>
        string.IsNullOrEmpty(FormatLogDateTime(value)) ? "—" : FormatLogDateTime(value);

    public static string FormatDateOnly(DateOnly? value) =>
        value?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture) ?? "—";

    public static string DisplayIp(string? clientIp)
    {
        if (string.IsNullOrWhiteSpace(clientIp))
        {
            return string.Empty;
        }

        var raw = clientIp.Trim();
        if (raw is "::1" or "0:0:0:0:0:0:0:1")
        {
            return "127.0.0.1";
        }

        if (IPAddress.TryParse(raw, out var parsed))
        {
            if (IPAddress.IsLoopback(parsed))
            {
                return "127.0.0.1";
            }

            if (parsed.AddressFamily == AddressFamily.InterNetworkV6 && parsed.IsIPv4MappedToIPv6)
            {
                return parsed.MapToIPv4().ToString();
            }

            return parsed.ToString();
        }

        return raw;
    }

    public static string DisplayIpOrDash(string? clientIp)
    {
        var ip = DisplayIp(clientIp);
        return string.IsNullOrEmpty(ip) ? "—" : ip;
    }

    public static DateOnly? ToDateOnly(DateTime? pickerDate) =>
        pickerDate == null ? null : DateOnly.FromDateTime(pickerDate.Value);

    public static DateTime? ToDateTime(DateOnly? date) =>
        date == null ? null : date.Value.ToDateTime(TimeOnly.MinValue);

    public static string FormatDeptLabel(string? unitCode, string? deptName) =>
        DeptDisplayFormatter.Format(unitCode, deptName);
}
