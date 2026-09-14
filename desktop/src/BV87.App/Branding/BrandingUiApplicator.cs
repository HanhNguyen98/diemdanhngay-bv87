using System.Windows;
using System.Windows.Media;
using BV87.App.Controls;
using BV87.App.Windows;
using BV87.Core;
using BV87.Core.Constants;
using BV87.Core.Models;

namespace BV87.App.Branding;

public static class BrandingUiApplicator
{
    public static void ApplyLogin(LoginWindow window, AppBrandingState state)
    {
        ApplyLoginHeader(window.HeaderLogo, state);
        ApplyLoginBackground(window.LoginBackgroundImage, window.LoginBackgroundOverlay, state);
        window.Title = ShellUiStrings.WindowTitle;
    }

    public static void ApplyShellSidebar(HospitalLogo logo, AppBrandingState state, AppMode mode, UserProfile? user = null)
    {
        logo.LogoSource = BrandingImageHelper.ResolveLogoImage(state.LogoUrl);
        logo.AppSubtitle = state.PortalTitle;
        if (mode == AppMode.Head && !string.IsNullOrWhiteSpace(user?.DeptName))
        {
            logo.HospitalName = user!.DeptName!.Trim();
            logo.ShowHospitalName = true;
        }
        else
        {
            logo.ShowHospitalName = false;
        }
    }

    private static void ApplyLoginHeader(HospitalLogo logo, AppBrandingState state)
    {
        logo.LogoSource = BrandingImageHelper.ResolveLogoImage(state.LogoUrl);
        logo.AppSubtitle = state.PortalTitle;
        logo.HospitalName = HospitalBranding.LoginProgramSubtitle;
        logo.ShowHospitalName = true;
        logo.ShowAppSubtitle = true;
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
