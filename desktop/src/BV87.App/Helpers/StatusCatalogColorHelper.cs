using System.Windows.Media;
using BV87.Core.Constants;

namespace BV87.App.Helpers;

public static class StatusCatalogColorHelper
{
    public static SolidColorBrush GetBrush(string? colorKey)
    {
        var color = (colorKey ?? string.Empty).ToLowerInvariant() switch
        {
            "green" => Color.FromRgb(0x10, 0xB9, 0x81),
            "red" => Color.FromRgb(0xEF, 0x44, 0x44),
            "yellow" => Color.FromRgb(0xF5, 0x9E, 0x0B),
            "blue" => Color.FromRgb(0x3B, 0x82, 0xF6),
            "teal" => Color.FromRgb(0x14, 0xB8, 0xA6),
            "purple" => Color.FromRgb(0xA8, 0x55, 0xF7),
            "amber" => Color.FromRgb(0xF9, 0x73, 0x16),
            "pink" => Color.FromRgb(0xEC, 0x48, 0x99),
            "brown" => Color.FromRgb(0xA1, 0x62, 0x07),
            "gray" => Color.FromRgb(0x6B, 0x72, 0x80),
            "black" => Color.FromRgb(0x11, 0x18, 0x27),
            "lime" => Color.FromRgb(0x84, 0xCC, 0x16),
            "cyan" => Color.FromRgb(0x06, 0xB6, 0xD4),
            "indigo" => Color.FromRgb(0x63, 0x66, 0xF1),
            _ => Color.FromRgb(0x9C, 0xA3, 0xAF)
        };

        var brush = new SolidColorBrush(color);
        brush.Freeze();
        return brush;
    }

    public static string GetColorLabel(string? colorKey) => StatusCatalogOptions.GetColorLabel(colorKey);
}
