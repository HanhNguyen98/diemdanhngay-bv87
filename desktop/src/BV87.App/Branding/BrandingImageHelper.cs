using System.IO;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace BV87.App.Branding;

/// <summary>Resolve logo/avatar strings (data URL) to WPF images with bundled fallback.</summary>
public static class BrandingImageHelper
{
    public static ImageSource CreateBundledLogo() =>
        CreateFromUri(new Uri($"pack://application:,,,{HospitalBranding.LogoResourcePath}", UriKind.Absolute));

    public static ImageSource ResolveLogoImage(string? logoUrl)
    {
        var fromRemote = TryCreateImageSource(logoUrl);
        return fromRemote ?? CreateBundledLogo();
    }

    public static ImageSource? TryCreateImageSource(string? source)
    {
        if (string.IsNullOrWhiteSpace(source))
        {
            return null;
        }

        try
        {
            if (source.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            {
                return CreateFromDataUrl(source);
            }

            return CreateFromUri(new Uri(source, UriKind.Absolute));
        }
        catch
        {
            return null;
        }
    }

    private static ImageSource CreateFromDataUrl(string dataUrl)
    {
        var commaIndex = dataUrl.IndexOf(',');
        if (commaIndex < 0)
        {
            throw new FormatException("Invalid data URL");
        }

        var base64 = dataUrl[(commaIndex + 1)..];
        var bytes = Convert.FromBase64String(base64);
        using var stream = new MemoryStream(bytes);
        var image = new BitmapImage();
        image.BeginInit();
        image.StreamSource = stream;
        image.CacheOption = BitmapCacheOption.OnLoad;
        image.EndInit();
        image.Freeze();
        return image;
    }

    private static ImageSource CreateFromUri(Uri uri)
    {
        var image = new BitmapImage();
        image.BeginInit();
        image.UriSource = uri;
        image.CacheOption = BitmapCacheOption.OnLoad;
        image.EndInit();
        image.Freeze();
        return image;
    }
}
