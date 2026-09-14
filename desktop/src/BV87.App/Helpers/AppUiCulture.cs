using System.Globalization;
using System.Windows;
using System.Windows.Markup;

namespace BV87.App.Helpers;

/// <summary>Locks WPF DatePicker and date parsing to Vietnamese <c>dd/MM/yyyy</c>.</summary>
public static class AppUiCulture
{
    public const string LanguageTag = "vi-VN";
    public const string ShortDatePattern = "dd/MM/yyyy";

    public static void Apply()
    {
        var culture = new CultureInfo(LanguageTag);
        culture.DateTimeFormat.ShortDatePattern = ShortDatePattern;
        culture.DateTimeFormat.DateSeparator = "/";

        CultureInfo.DefaultThreadCurrentCulture = culture;
        CultureInfo.DefaultThreadCurrentUICulture = culture;
        CultureInfo.CurrentCulture = culture;
        CultureInfo.CurrentUICulture = culture;

        var language = XmlLanguage.GetLanguage(LanguageTag);
        FrameworkElement.LanguageProperty.OverrideMetadata(
            typeof(FrameworkElement),
            new FrameworkPropertyMetadata(language));
    }
}
