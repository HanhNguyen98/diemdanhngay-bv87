using System.Globalization;

namespace BV87.Core.Helpers;

/// <summary>HEAD H1: page title plus department name (SPEC D-HEAD.1).</summary>
public static class HeadPageTitleFormatter
{
    private static readonly CultureInfo Vietnamese = CultureInfo.GetCultureInfo("vi-VN");

    /// <summary>
    /// <c>{pageTitle} &gt; {DEPT}</c> when <paramref name="deptName"/> is present; otherwise page title only.
    /// </summary>
    public static string Format(string pageTitle, string? deptName)
    {
        var name = deptName?.Trim() ?? string.Empty;
        if (name.Length == 0)
        {
            return pageTitle;
        }

        return $"{pageTitle} > {name.ToUpper(Vietnamese)}";
    }
}
