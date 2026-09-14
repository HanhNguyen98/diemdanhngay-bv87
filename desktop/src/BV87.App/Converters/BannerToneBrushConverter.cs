using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;
using BV87.App.ViewModels.Utilities;

namespace BV87.App.Converters;

/// <summary>Maps FingerprintBannerTone to semantic background or foreground brush (ConverterParameter: Bg | Fg).</summary>
public sealed class BannerToneBrushConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var useBackground = string.Equals(parameter as string, "Bg", StringComparison.OrdinalIgnoreCase);
        if (value is not FingerprintBannerTone tone || tone == FingerprintBannerTone.None)
        {
            return Brushes.Transparent;
        }

        var key = (tone, useBackground) switch
        {
            (FingerprintBannerTone.Success, true) => "SuccessBgBrush",
            (FingerprintBannerTone.Success, false) => "SuccessFgBrush",
            (FingerprintBannerTone.Warning, true) => "WarningBgBrush",
            (FingerprintBannerTone.Warning, false) => "WarningFgBrush",
            (FingerprintBannerTone.Danger, true) => "DangerBgBrush",
            (FingerprintBannerTone.Danger, false) => "DangerFgBrush",
            _ => useBackground ? "InfoBgBrush" : "InfoFgBrush"
        };

        return Application.Current.TryFindResource(key) as Brush ?? Brushes.Transparent;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
