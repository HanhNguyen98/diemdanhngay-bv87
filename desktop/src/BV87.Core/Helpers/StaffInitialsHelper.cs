namespace BV87.Core.Helpers;

/// <summary>Two-letter initials for staff avatar placeholders.</summary>
public static class StaffInitialsHelper
{
    public static string FromFullname(string? fullname)
    {
        var parts = (fullname ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0)
        {
            return "?";
        }

        if (parts.Length == 1)
        {
            return parts[0][..Math.Min(2, parts[0].Length)].ToUpperInvariant();
        }

        return string.Concat(parts[0][0], parts[^1][0]).ToUpperInvariant();
    }
}
