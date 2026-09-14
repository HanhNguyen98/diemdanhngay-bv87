using System.Windows;
using System.Windows.Controls;
using System.Windows.Media.Animation;
using System.Windows.Threading;

namespace BV87.App.Controls;

/// <summary>Centered busy ring; shows immediately on search/refresh (D-UI.48).</summary>
public partial class PageBusyOverlay : UserControl
{
    private const int FirstLoadDelayMs = 120;
    private const int RefreshDelayMs = 0;

    public static readonly DependencyProperty IsLoadingProperty =
        DependencyProperty.Register(
            nameof(IsLoading),
            typeof(bool),
            typeof(PageBusyOverlay),
            new PropertyMetadata(false, OnBusyChanged));

    public static readonly DependencyProperty IsRefreshingProperty =
        DependencyProperty.Register(
            nameof(IsRefreshing),
            typeof(bool),
            typeof(PageBusyOverlay),
            new PropertyMetadata(false, OnBusyChanged));

    private readonly DispatcherTimer _delayTimer;

    public PageBusyOverlay()
    {
        InitializeComponent();
        _delayTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(FirstLoadDelayMs) };
        _delayTimer.Tick += OnDelayElapsed;
        Loaded += (_, _) => ScheduleOrHide();
        Unloaded += (_, _) =>
        {
            _delayTimer.Stop();
            HideNow();
        };
    }

    public bool IsLoading
    {
        get => (bool)GetValue(IsLoadingProperty);
        set => SetValue(IsLoadingProperty, value);
    }

    public bool IsRefreshing
    {
        get => (bool)GetValue(IsRefreshingProperty);
        set => SetValue(IsRefreshingProperty, value);
    }

    private static void OnBusyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is PageBusyOverlay overlay)
        {
            overlay.ScheduleOrHide();
        }
    }

    private void ScheduleOrHide()
    {
        if (!IsLoading && !IsRefreshing)
        {
            _delayTimer.Stop();
            HideNow();
            return;
        }

        if (Visibility == Visibility.Visible)
        {
            return;
        }

        var delayMs = IsRefreshing && !IsLoading ? RefreshDelayMs : FirstLoadDelayMs;
        if (delayMs <= 0)
        {
            ShowNow();
            return;
        }

        _delayTimer.Stop();
        _delayTimer.Interval = TimeSpan.FromMilliseconds(delayMs);
        _delayTimer.Start();
    }

    private void OnDelayElapsed(object? sender, EventArgs e)
    {
        _delayTimer.Stop();
        if (IsLoading || IsRefreshing)
        {
            ShowNow();
        }
    }

    private void ShowNow()
    {
        Visibility = Visibility.Visible;
        StartRing();
    }

    private void HideNow()
    {
        Visibility = Visibility.Collapsed;
        StopRing();
    }

    private void StartRing()
    {
        if (FindResource("RingStoryboard") is Storyboard board)
        {
            Timeline.SetDesiredFrameRate(board, 30);
            board.Begin(this, true);
        }
    }

    private void StopRing()
    {
        if (FindResource("RingStoryboard") is Storyboard board)
        {
            board.Stop(this);
        }

        RingRotate.Angle = 0;
    }
}
