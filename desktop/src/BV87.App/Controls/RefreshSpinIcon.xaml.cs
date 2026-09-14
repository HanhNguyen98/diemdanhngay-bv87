using System.Windows;
using System.Windows.Controls;
using System.Windows.Media.Animation;

namespace BV87.App.Controls;

/// <summary>Refresh glyph that spins while busy and always stops when IsSpinning is false.</summary>
public partial class RefreshSpinIcon : UserControl
{
    public static readonly DependencyProperty IsSpinningProperty =
        DependencyProperty.Register(
            nameof(IsSpinning),
            typeof(bool),
            typeof(RefreshSpinIcon),
            new PropertyMetadata(false, OnIsSpinningChanged));

    public RefreshSpinIcon()
    {
        InitializeComponent();
        Loaded += (_, _) => ApplySpinState();
        Unloaded += (_, _) => StopSpin();
    }

    public bool IsSpinning
    {
        get => (bool)GetValue(IsSpinningProperty);
        set => SetValue(IsSpinningProperty, value);
    }

    private static void OnIsSpinningChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is RefreshSpinIcon icon)
        {
            icon.ApplySpinState();
        }
    }

    private void ApplySpinState()
    {
        if (!IsLoaded)
        {
            return;
        }

        if (IsSpinning)
        {
            StartSpin();
        }
        else
        {
            StopSpin();
        }
    }

    private void StartSpin()
    {
        if (FindResource("SpinStoryboard") is Storyboard board)
        {
            Timeline.SetDesiredFrameRate(board, 30);
            board.Begin(this, true);
        }
    }

    private void StopSpin()
    {
        if (FindResource("SpinStoryboard") is Storyboard board)
        {
            board.Stop(this);
        }

        Rotate.Angle = 0;
    }
}
