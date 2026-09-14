using System.Globalization;
using System.Windows.Data;
using BV87.App.Branding;

namespace BV87.App.Converters;

/// <summary>Converts branding data URL or http(s) URI strings to WPF ImageSource.</summary>
public sealed class DataUrlToImageSourceConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is not string source || string.IsNullOrWhiteSpace(source))
        {
            return null;
        }

        return BrandingImageHelper.TryCreateImageSource(source);
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
