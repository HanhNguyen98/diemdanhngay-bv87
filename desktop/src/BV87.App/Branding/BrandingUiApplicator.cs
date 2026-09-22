using System.Windows;
using BV87.App.Controls;
using BV87.App.Windows;
using BV87.Core.Constants;

namespace BV87.App.Branding;

public static class BrandingUiApplicator
{
    public static void ApplyLogin(LoginWindow window, AppBrandingState state)
    {
        ApplyLoginHeader(window.HeaderLogo, state);
        ApplyLoginBackground(window.LoginBackgroundImage, window.LoginBackgroundOverlay, state);
        window.Title = ShellUiStrings.WindowTitle;
    }

    public static void ApplyShellSidebar(HospitalLogo logo, AppBrandingState state)
    {
        ApplyHeaderLogo(logo, state);
    }

    private static void ApplyLoginHeader(HospitalLogo logo, AppBrandingState state)
    {
        ApplyHeaderLogo(logo, state);
    }

    private static void ApplyHeaderLogo(HospitalLogo logo, AppBrandingState state)
    {
        logo.LogoSource = BrandingImageHelper.ResolveLogoImage(state.LogoUrl);
        logo.AppSubtitle = state.PortalTitle;
        logo.HospitalName = state.PortalSubtitle;
        logo.ShowAppSubtitle = true;
        logo.ShowHospitalName = true;
    }

    private static void ApplyLoginBackground(
        System.Windows.Controls.Image backgroundImage,
        UIElement overlay,
        AppBrandingState state)
    {
        var avatar = BrandingImageHelper.TryCreateImageSource(state.LoginAvatarUrl);
        if (avatar == null)
        {
            backgroundImage.Source = null;
            backgroundImage.Visibility = Visibility.Collapsed;
            overlay.Visibility = Visibility.Collapsed;
            return;
        }

        backgroundImage.Source = avatar;
        backgroundImage.Visibility = Visibility.Visible;
        overlay.Visibility = Visibility.Visible;
    }
}
