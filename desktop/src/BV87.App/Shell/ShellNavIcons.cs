namespace BV87.App.Shell;

/// <summary>Segoe MDL2 Assets glyphs for sidebar navigation items.</summary>
public static class ShellNavIcons
{
    public static string GetGlyph(string navId) => navId switch
    {
        "dashboard-overview" => "\uE9D2",
        "dashboard-dept" => "\uE821",
        "attendance" => "\uE787",
        "statistics" => "\uE9D2",
        "staff" => "\uE716",
        "departments" => "\uE821",
        "ranks" => "\uE82F",
        "positions" => "\uE779",
        "statuses" => "\uE734",
        "unlock-requests" => "\uE785",
        "audit-logs" => "\uE7BA",
        "fingerprint-history" => "\uE7BA",
        "fingerprint-enroll" => "\uE962",
        "reminder-history" => "\uE715",
        "settings-permissions" => "\uE72C",
        "settings-kiosk" => "\uE7F8",
        "settings-system" => "\uE713",
        "settings" => "\uE713",
        "password" => "\uE72E",
        "kiosk-scan" => "\uE962",
        _ => "\uE81E"
    };
}
