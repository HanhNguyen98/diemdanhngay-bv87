using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace BV87.App.Controls;

public partial class StatusBadge : UserControl
{
    public static readonly DependencyProperty LabelProperty =
        DependencyProperty.Register(nameof(Label), typeof(string), typeof(StatusBadge),
            new PropertyMetadata(string.Empty, OnVisualChanged));

    public static readonly DependencyProperty KindProperty =
        DependencyProperty.Register(nameof(Kind), typeof(StatusBadgeKind), typeof(StatusBadge),
            new PropertyMetadata(StatusBadgeKind.Neutral, OnVisualChanged));

    public StatusBadge()
    {
        InitializeComponent();
        Loaded += (_, _) => ApplyVisual();
    }

    public string Label
    {
        get => (string)GetValue(LabelProperty);
        set => SetValue(LabelProperty, value);
    }

    public StatusBadgeKind Kind
    {
        get => (StatusBadgeKind)GetValue(KindProperty);
        set => SetValue(KindProperty, value);
    }

    private static void OnVisualChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is StatusBadge badge)
        {
            badge.ApplyVisual();
        }
    }

    private void ApplyVisual()
    {
        LabelText.Text = Label;
        ToolTip = string.IsNullOrWhiteSpace(Label) || Label == "—" ? null : Label;
        var (bg, fg) = Kind switch
        {
            StatusBadgeKind.Success => ("SuccessBgBrush", "SuccessFgBrush"),
            StatusBadgeKind.Danger => ("DangerBgBrush", "DangerFgBrush"),
            StatusBadgeKind.Info => ("InfoBgBrush", "InfoFgBrush"),
            StatusBadgeKind.Warning => ("WarningBgBrush", "WarningFgBrush"),
            _ => ("NeutralBgBrush", "NeutralFgBrush")
        };

        BadgeRoot.Background = (Brush)FindResource(bg);
        LabelText.Foreground = (Brush)FindResource(fg);
    }
}

public enum StatusBadgeKind
{
    Neutral,
    Success,
    Danger,
    Info,
    Warning
}
