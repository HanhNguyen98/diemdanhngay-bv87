using System.Globalization;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using BV87.App.Shell;
using BV87.App.Windows;

namespace BV87.App.Branding;

public static class WindowBrandingHelper
{
    private const int TitleBarIconSize = 32;

    public static bool IsHospitalLogoWindow(Window window) =>
        window is MainShellWindow or LoginWindow or AgentScanWindow;

    public static void ApplyForWindow(Window window)
    {
        if (IsHospitalLogoWindow(window))
        {
            ApplyHospitalIcon(window);
            return;
        }

        ApplyGlyphIcon(window, DialogWindowIcons.GetGlyph(window));
    }

    public static void ApplyHospitalIcon(Window window)
    {
        ApplyWindowIcon(window, App.Branding?.Current);
    }

    public static void ApplyWindowIcon(Window window, AppBrandingState? _)
    {
        SetIcon(window, CreateBundledTitleBarIcon());
    }

    public static void ApplyGlyphIcon(Window window, string glyph)
    {
        SetIcon(window, CreateGlyphTitleBarIcon(glyph));
    }

    private static void SetIcon(Window window, ImageSource icon)
    {
        window.Icon = icon;
        if (!window.IsLoaded)
        {
            window.SourceInitialized += (_, _) => window.Icon = icon;
        }
    }

    private static ImageSource CreateBundledTitleBarIcon() =>
        ToTitleBarIcon(BrandingImageHelper.CreateBundledLogo(), TitleBarIconSize);

    private static ImageSource CreateGlyphTitleBarIcon(string glyph)
    {
        var visual = new DrawingVisual();
        using (var context = visual.RenderOpen())
        {
            var radius = TitleBarIconSize / 2.0;
            var background = TryFindBrush("PrimaryBrush");
            if (background == null)
            {
                background = new SolidColorBrush(Color.FromRgb(0x25, 0x63, 0xEB));
                background.Freeze();
            }
            context.DrawEllipse(background, null, new Point(radius, radius), radius, radius);

            var fontFamily = TryFindFontFamily("IconFont") ?? new FontFamily("Segoe MDL2 Assets");
            var formatted = new FormattedText(
                glyph,
                CultureInfo.CurrentUICulture,
                FlowDirection.LeftToRight,
                new Typeface(fontFamily, FontStyles.Normal, FontWeights.Normal, FontStretches.Normal),
                18,
                Brushes.White,
                96);
            context.DrawText(
                formatted,
                new Point((TitleBarIconSize - formatted.Width) / 2, (TitleBarIconSize - formatted.Height) / 2));
        }

        var bitmap = new RenderTargetBitmap(TitleBarIconSize, TitleBarIconSize, 96, 96, PixelFormats.Pbgra32);
        bitmap.Render(visual);
        bitmap.Freeze();
        return bitmap;
    }

    /// <summary>Title-bar chrome needs a small square; a full-size PNG/data URL looks like a generic blob.</summary>
    private static ImageSource ToTitleBarIcon(ImageSource source, int size)
    {
        var visual = new DrawingVisual();
        using (var context = visual.RenderOpen())
        {
            context.DrawImage(source, new Rect(0, 0, size, size));
        }

        var bitmap = new RenderTargetBitmap(size, size, 96, 96, PixelFormats.Pbgra32);
        bitmap.Render(visual);
        bitmap.Freeze();
        return bitmap;
    }

    private static Brush? TryFindBrush(string key) =>
        Application.Current?.TryFindResource(key) as Brush;

    private static FontFamily? TryFindFontFamily(string key) =>
        Application.Current?.TryFindResource(key) as FontFamily;
}
