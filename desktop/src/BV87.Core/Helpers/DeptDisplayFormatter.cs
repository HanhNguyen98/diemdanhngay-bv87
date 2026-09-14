namespace BV87.Core.Helpers;

/// <summary>Formats department labels as ký hiệu + name (SPEC D-UI.44).</summary>
public static class DeptDisplayFormatter
{
    /// <summary>
    /// <c>{unitCode} - {deptName}</c> when ký hiệu exists; otherwise name only.
    /// Does not use padded <c>dept_code</c> as a stand-in for ký hiệu.
    /// </summary>
    public static string Format(string? unitCode, string? deptName, string? emptyFallback = "—")
    {
        var kyHieu = unitCode?.Trim() ?? string.Empty;
        var name = deptName?.Trim() ?? string.Empty;
        if (kyHieu.Length > 0 && name.Length > 0)
        {
            return $"{kyHieu} - {name}";
        }

        if (kyHieu.Length > 0)
        {
            return kyHieu;
        }

        if (name.Length > 0)
        {
            return name;
        }

        return string.IsNullOrWhiteSpace(emptyFallback) ? "—" : emptyFallback.Trim();
    }
}
