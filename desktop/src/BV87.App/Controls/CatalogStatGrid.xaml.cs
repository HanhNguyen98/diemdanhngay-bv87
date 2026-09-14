using System.Windows;
using System.Windows.Controls;

namespace BV87.App.Controls;

public partial class CatalogStatGrid : UserControl
{
    public static readonly DependencyProperty TotalLabelProperty =
        DependencyProperty.Register(nameof(TotalLabel), typeof(string), typeof(CatalogStatGrid));

    public static readonly DependencyProperty TotalValueProperty =
        DependencyProperty.Register(nameof(TotalValue), typeof(string), typeof(CatalogStatGrid));

    public static readonly DependencyProperty ActiveLabelProperty =
        DependencyProperty.Register(nameof(ActiveLabel), typeof(string), typeof(CatalogStatGrid));

    public static readonly DependencyProperty ActiveValueProperty =
        DependencyProperty.Register(nameof(ActiveValue), typeof(string), typeof(CatalogStatGrid));

    public static readonly DependencyProperty InactiveLabelProperty =
        DependencyProperty.Register(nameof(InactiveLabel), typeof(string), typeof(CatalogStatGrid));

    public static readonly DependencyProperty InactiveValueProperty =
        DependencyProperty.Register(nameof(InactiveValue), typeof(string), typeof(CatalogStatGrid));

    public CatalogStatGrid()
    {
        InitializeComponent();
    }

    public string TotalLabel
    {
        get => (string)GetValue(TotalLabelProperty);
        set => SetValue(TotalLabelProperty, value);
    }

    public string TotalValue
    {
        get => (string)GetValue(TotalValueProperty);
        set => SetValue(TotalValueProperty, value);
    }

    public string ActiveLabel
    {
        get => (string)GetValue(ActiveLabelProperty);
        set => SetValue(ActiveLabelProperty, value);
    }

    public string ActiveValue
    {
        get => (string)GetValue(ActiveValueProperty);
        set => SetValue(ActiveValueProperty, value);
    }

    public string InactiveLabel
    {
        get => (string)GetValue(InactiveLabelProperty);
        set => SetValue(InactiveLabelProperty, value);
    }

    public string InactiveValue
    {
        get => (string)GetValue(InactiveValueProperty);
        set => SetValue(InactiveValueProperty, value);
    }
}
