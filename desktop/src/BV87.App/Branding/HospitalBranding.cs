namespace BV87.App.Branding;

/// <summary>Fallback branding when API/cache unavailable — bundled logo + default portal title.</summary>
public static class HospitalBranding
{
    public const string DefaultPortalTitle = "BỆNH VIỆN QUÂN Y 87";
    public const string LegacyPortalTitle = "Bệnh viện Quân y 87";
    public const string HospitalName = LegacyPortalTitle;
    public const string AppSubtitle = "Chấm công";
    public const string LoginProgramSubtitle = "Chương trình chấm công";
    public const string LogoResourcePath = "/Resources/Images/hospital-logo.png";
}
