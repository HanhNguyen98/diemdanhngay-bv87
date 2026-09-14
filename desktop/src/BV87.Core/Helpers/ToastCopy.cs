namespace BV87.Core.Helpers;

/// <summary>Short Vietnamese toast sentences — SPEC D-UI.18.</summary>
public static class ToastCopy
{
    public static string Staff(string? name) =>
        string.IsNullOrWhiteSpace(name) ? "nhân viên" : $"nhân viên {name.Trim()}";

    public static string Dept(string? name) =>
        string.IsNullOrWhiteSpace(name) ? "đơn vị" : $"đơn vị {name.Trim()}";

    public static string Account(string? username) =>
        string.IsNullOrWhiteSpace(username) ? "tài khoản" : $"tài khoản {username.Trim()}";

    public static string Kiosk(string? label) =>
        string.IsNullOrWhiteSpace(label) ? "kiosk" : $"kiosk {label.Trim()}";

    public static string Days(int count) => count == 1 ? "1 ngày" : $"{count} ngày";

    public static string Ok(string verb, string? content, string subject)
    {
        var body = content?.Trim() ?? string.Empty;
        return string.IsNullOrEmpty(body)
            ? $"Đã {verb} thành công cho {subject}."
            : $"Đã {verb} thành công {body} cho {subject}.";
    }

    public static string OkItem(string verb, string item) =>
        $"Đã {verb} thành công {item.Trim()}.";

    public static string Fail(string verb, string? content, string subject)
    {
        var body = content?.Trim() ?? string.Empty;
        return string.IsNullOrEmpty(body)
            ? $"Đã {verb} thất bại cho {subject}."
            : $"Đã {verb} thất bại {body} cho {subject}.";
    }

    public static string FailItem(string verb, string item) =>
        $"Đã {verb} thất bại {item.Trim()}.";

    public static string Warn(string verb, string? content, string subject, string reason)
    {
        var body = content?.Trim() ?? string.Empty;
        var head = string.IsNullOrEmpty(body)
            ? $"Cảnh báo: đã {verb} cho {subject}"
            : $"Cảnh báo: đã {verb} {body} cho {subject}";
        var why = reason.Trim().TrimEnd('.');
        return string.IsNullOrEmpty(why) ? $"{head}." : $"{head}; {why}.";
    }

    public static string WarnItem(string verb, string item, string reason)
    {
        var why = reason.Trim().TrimEnd('.');
        return $"Cảnh báo: đã {verb} {item.Trim()}; {why}.";
    }

    public static string SkipReason(int fingerprint, int softLock)
    {
        var parts = new List<string>();
        if (fingerprint > 0)
        {
            parts.Add($"bỏ qua {Days(fingerprint)} đã quét vân tay");
        }

        if (softLock > 0)
        {
            parts.Add($"bỏ qua {Days(softLock)} bị khóa mềm");
        }

        return string.Join("; ", parts);
    }
}
