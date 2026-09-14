using System.Collections;
using System.Windows;
using System.Windows.Controls;

namespace BV87.App.Controls;

public partial class DashboardKpiBar : UserControl
{
    public static readonly DependencyProperty KpiTotalTextProperty =
        DependencyProperty.Register(nameof(KpiTotalText), typeof(string), typeof(DashboardKpiBar));

    public static readonly DependencyProperty ScopeLabelProperty =
        DependencyProperty.Register(nameof(ScopeLabel), typeof(string), typeof(DashboardKpiBar));

    public static readonly DependencyProperty UncheckedCountProperty =
        DependencyProperty.Register(nameof(UncheckedCount), typeof(long), typeof(DashboardKpiBar));

    public static readonly DependencyProperty KpiItemsProperty =
        DependencyProperty.Register(nameof(KpiItems), typeof(IEnumerable), typeof(DashboardKpiBar));

    public DashboardKpiBar()
    {
        InitializeComponent();
    }

    public string KpiTotalText
    {
        get => (string)GetValue(KpiTotalTextProperty);
        set => SetValue(KpiTotalTextProperty, value);
    }

    public string ScopeLabel
    {
        get => (string)GetValue(ScopeLabelProperty);
        set => SetValue(ScopeLabelProperty, value);
    }

    public long UncheckedCount
    {
        get => (long)GetValue(UncheckedCountProperty);
        set => SetValue(UncheckedCountProperty, value);
    }

    public IEnumerable? KpiItems
    {
        get => (IEnumerable?)GetValue(KpiItemsProperty);
        set => SetValue(KpiItemsProperty, value);
    }
}
