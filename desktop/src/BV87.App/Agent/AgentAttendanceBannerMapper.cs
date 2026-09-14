using BV87.App.ViewModels.Utilities;
using BV87.Core.Models.Kiosk;

namespace BV87.App.Agent;

/// <summary>Maps scan API direction/status to Vietnamese banner text (SPEC §9.3.1).</summary>
public static class AgentAttendanceBannerMapper
{
    private const int RejectedMessageMaxLen = 72;

    public sealed record AttendanceBanner(string Text, FingerprintBannerTone Tone);

    public static AttendanceBanner Map(string? direction, string? status, string? message)
    {
        return direction switch
        {
            "MORNING_IN" => new AttendanceBanner("VÀO SÁNG THÀNH CÔNG", FingerprintBannerTone.Success),
            "NOON_OUT" => new AttendanceBanner("RA TRƯA THÀNH CÔNG", FingerprintBannerTone.Success),
            "AFTERNOON_IN" => new AttendanceBanner("VÀO CHIỀU THÀNH CÔNG", FingerprintBannerTone.Success),
            "AFTERNOON_OUT" => string.Equals(status, "VE_SOM", StringComparison.Ordinal)
                ? new AttendanceBanner("RA CHIỀU — VỀ SỚM", FingerprintBannerTone.Warning)
                : new AttendanceBanner("RA CHIỀU THÀNH CÔNG", FingerprintBannerTone.Success),
            "IN" => new AttendanceBanner("VÀO THÀNH CÔNG", FingerprintBannerTone.Success),
            "OUT" => string.IsNullOrWhiteSpace(status)
                ? new AttendanceBanner("RA — CHƯA CÓ GIỜ VÀO", FingerprintBannerTone.Warning)
                : new AttendanceBanner("RA THÀNH CÔNG", FingerprintBannerTone.Success),
            "REJECTED" => BuildRejected(message),
            _ => new AttendanceBanner("LỖI", FingerprintBannerTone.Danger)
        };
    }

    public static string FormatResultLine(FingerprintScanResultDto result, AttendanceBanner banner)
    {
        var code = !string.IsNullOrWhiteSpace(result.EmpCodeFormatted)
            ? result.EmpCodeFormatted
            : result.EmpCode.ToString("D5");
        var name = string.IsNullOrWhiteSpace(result.Fullname) ? "—" : result.Fullname!;
        return $"{code} - {name} - {banner.Text}";
    }

    public static string FormatResultLine(int empCode, string? fullname, AttendanceBanner banner) =>
        $"{empCode:D5} - {(string.IsNullOrWhiteSpace(fullname) ? "—" : fullname)} - {banner.Text}";

    private static AttendanceBanner BuildRejected(string? message)
    {
        var msg = message?.Trim() ?? string.Empty;
        return string.IsNullOrEmpty(msg)
            ? new AttendanceBanner("TỪ CHỐI", FingerprintBannerTone.Warning)
            : new AttendanceBanner($"TỪ CHỐI — {Truncate(msg)}", FingerprintBannerTone.Warning);
    }

    private static string Truncate(string message) =>
        message.Length <= RejectedMessageMaxLen
            ? message
            : message[..(RejectedMessageMaxLen - 1)] + "…";
}
