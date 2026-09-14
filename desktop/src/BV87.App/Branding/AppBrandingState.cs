namespace BV87.App.Branding;

/// <summary>Resolved branding snapshot for WPF surfaces — parity Web AppBootstrapContext.</summary>
public sealed class AppBrandingState
{
    public string PortalTitle { get; init; } = HospitalBranding.DefaultPortalTitle;
    public string? LogoUrl { get; init; }
    public string? LoginAvatarUrl { get; init; }

    public static AppBrandingState Defaults { get; } = new();

    public static string NormalizePortalTitle(string? title)
    {
        if (string.IsNullOrWhiteSpace(title)
            || string.Equals(title.Trim(), HospitalBranding.LegacyPortalTitle, StringComparison.OrdinalIgnoreCase))
        {
            return HospitalBranding.DefaultPortalTitle;
        }

        return title.Trim();
    }

    public static AppBrandingState FromDto(string? portalTitle, string? logoUrl, string? loginAvatarUrl) => new()
    {
        PortalTitle = NormalizePortalTitle(portalTitle),
        LogoUrl = string.IsNullOrWhiteSpace(logoUrl) ? null : logoUrl,
        LoginAvatarUrl = string.IsNullOrWhiteSpace(loginAvatarUrl) ? null : loginAvatarUrl
    };
}
