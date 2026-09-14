using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Threading;
using BV87.App.Toasts;

namespace BV87.App.Controls;

/// <summary>Shell overlay toast — auto-dismiss 4500ms, SPEC D-ATT.2.</summary>
public partial class ToastHost : UserControl
{
    private const int AutoDismissMs = 4500;
    private readonly DispatcherTimer _timer = new() { Interval = TimeSpan.FromMilliseconds(AutoDismissMs) };

    public ToastHost()
    {
        InitializeComponent();
        _timer.Tick += (_, _) => HideToast();
        Loaded += OnLoaded;
        Unloaded += OnUnloaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        App.Toasts.Shown += OnToastShown;
    }

    private void OnUnloaded(object sender, RoutedEventArgs e)
    {
        App.Toasts.Shown -= OnToastShown;
        _timer.Stop();
    }

    private void OnToastShown(object? sender, ToastRequest request)
    {
        if (!Dispatcher.CheckAccess())
        {
            Dispatcher.Invoke(() => ShowToast(request));
            return;
        }

        ShowToast(request);
    }

    private void ShowToast(ToastRequest request)
    {
        ApplyTone(request.Tone);
        MessageText.Text = request.Message;
        Visibility = Visibility.Visible;
        IsHitTestVisible = true;
        _timer.Stop();
        _timer.Start();
    }

    private void HideToast()
    {
        _timer.Stop();
        Visibility = Visibility.Collapsed;
        IsHitTestVisible = false;
    }

    private void CloseButton_Click(object sender, RoutedEventArgs e) => HideToast();

    private void ApplyTone(ToastTone tone)
    {
        string backgroundKey;
        string foregroundKey;
        string glyph;
        switch (tone)
        {
            case ToastTone.Success:
                backgroundKey = "SuccessBgBrush";
                foregroundKey = "SuccessFgBrush";
                glyph = "\uE73E";
                break;
            case ToastTone.Warning:
                backgroundKey = "WarningBgBrush";
                foregroundKey = "WarningFgBrush";
                glyph = "\uE7BA";
                break;
            default:
                backgroundKey = "DangerBgBrush";
                foregroundKey = "DangerFgBrush";
                glyph = "\uE783";
                break;
        }

        ToastBorder.Background = (Brush)FindResource(backgroundKey);
        ToastBorder.BorderBrush = (Brush)FindResource(foregroundKey);
        IconText.Text = glyph;
        IconText.Foreground = (Brush)FindResource(foregroundKey);
    }
}
