using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace BV87.App.Converters;

public sealed class InverseBoolConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        value is true ? false : true;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        value is true ? false : true;
}

public sealed class InverseBoolToVisibilityConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        value is true ? Visibility.Collapsed : Visibility.Visible;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        value is Visibility.Collapsed;
}

public sealed class NullToVisibilityConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        string.IsNullOrWhiteSpace(value as string) ? Visibility.Collapsed : Visibility.Visible;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}

/// <summary>D-UI.48 — show empty search hint when the list is idle and has 0 rows.</summary>
public sealed class SearchEmptyVisibilityConverter : IMultiValueConverter
{
    public object Convert(object[] values, Type targetType, object? parameter, CultureInfo culture)
    {
        if (values.Length < 3
            || values[0] == DependencyProperty.UnsetValue
            || values[1] == DependencyProperty.UnsetValue
            || values[2] == DependencyProperty.UnsetValue)
        {
            return Visibility.Collapsed;
        }

        var isLoading = values[0] is true;
        var isRefreshing = values[1] is true;
        var total = System.Convert.ToInt64(values[2] ?? 0, culture);
        return !isLoading && !isRefreshing && total == 0
            ? Visibility.Visible
            : Visibility.Collapsed;
    }

    public object[] ConvertBack(object value, Type[] targetTypes, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
