using BV87.App.Controls;

namespace BV87.App.Helpers;

/// <summary>Sets DialogContextHeader modes per SPEC_DESKTOP §2.6.2 (D-UI.61).</summary>
public static class DialogContextHeaderHelper
{
    public static void SetPerson(DialogContextHeader header, string fullname, string? deptDisplay)
    {
        header.PrimaryText = string.IsNullOrWhiteSpace(fullname)
            ? string.Empty
            : fullname.Trim().ToUpperInvariant();
        header.SecondaryText = deptDisplay?.Trim() ?? string.Empty;
    }

    public static void SetBadge(DialogContextHeader header, string badgeText)
    {
        header.PrimaryText = string.IsNullOrWhiteSpace(badgeText)
            ? string.Empty
            : badgeText.Trim().ToUpperInvariant();
        header.SecondaryText = string.Empty;
    }

    /// <summary>
    /// Grant-screens dialog: badge on line 1, person context "Name — Dept" on line 2 (SPEC §2.6.2).
    /// </summary>
    public static void SetBadgeWithPerson(
        DialogContextHeader header,
        string badgeText,
        string? fullname,
        string? deptDisplay)
    {
        header.PrimaryText = string.IsNullOrWhiteSpace(badgeText)
            ? string.Empty
            : badgeText.Trim().ToUpperInvariant();

        var name = string.IsNullOrWhiteSpace(fullname) || fullname.Trim() == "—"
            ? string.Empty
            : fullname.Trim();
        var dept = string.IsNullOrWhiteSpace(deptDisplay) || deptDisplay.Trim() == "—"
            ? string.Empty
            : deptDisplay.Trim();

        if (string.IsNullOrEmpty(name) && string.IsNullOrEmpty(dept))
        {
            header.SecondaryText = string.Empty;
            return;
        }

        header.SecondaryText = string.IsNullOrEmpty(dept) ? name : $"{name} — {dept}";
    }
}
