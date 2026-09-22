using BV87.Core.Models.Admin;

namespace BV87.App.Branding;

/// <summary>Resolved branding snapshot for WPF surfaces — SPEC_DESKTOP §2.6 / §2.19.6.</summary>
public sealed class AppBrandingState
{
    public string PortalTitle { get; init; } = HospitalBranding.DefaultPortalTitle;
    public string PortalSubtitle { get; init; } = HospitalBranding.DefaultPortalSubtitle;
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

    public static string NormalizePortalSubtitle(string? subtitle)
    {
        if (string.IsNullOrWhiteSpace(subtitle))
        {
            return HospitalBranding.DefaultPortalSubtitle;
        }

        return subtitle.Trim();
    }

    public static AppBrandingState FromDto(BrandingDto dto) => new()
    {
        PortalTitle = NormalizePortalTitle(dto.PortalTitle),
        PortalSubtitle = NormalizePortalSubtitle(dto.PortalSubtitle),
        LogoUrl = string.IsNullOrWhiteSpace(dto.LogoUrl) ? null : dto.LogoUrl,
        LoginAvatarUrl = string.IsNullOrWhiteSpace(dto.LoginAvatarUrl) ? null : dto.LoginAvatarUrl
    };
}
