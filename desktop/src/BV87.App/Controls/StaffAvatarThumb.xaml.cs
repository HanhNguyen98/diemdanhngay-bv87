using System.Windows;
using System.Windows.Controls;
using BV87.App.Branding;

namespace BV87.App.Controls;

public partial class StaffAvatarThumb : UserControl
{
    public static readonly DependencyProperty AvatarUrlProperty =
        DependencyProperty.Register(
            nameof(AvatarUrl),
            typeof(string),
            typeof(StaffAvatarThumb),
            new PropertyMetadata(null, OnVisualChanged));

    public static readonly DependencyProperty InitialsProperty =
        DependencyProperty.Register(
            nameof(Initials),
            typeof(string),
            typeof(StaffAvatarThumb),
            new PropertyMetadata(string.Empty, OnVisualChanged));

    public StaffAvatarThumb()
    {
        InitializeComponent();
        Loaded += (_, _) => ApplyVisual();
    }

    public string? AvatarUrl
    {
        get => (string?)GetValue(AvatarUrlProperty);
        set => SetValue(AvatarUrlProperty, value);
    }

    public string Initials
    {
        get => (string)GetValue(InitialsProperty);
        set => SetValue(InitialsProperty, value);
    }

    private static void OnVisualChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is StaffAvatarThumb thumb)
        {
            thumb.ApplyVisual();
        }
    }

    private void ApplyVisual()
    {
        if (InitialsText == null || PreviewImage == null)
        {
            return;
        }

        InitialsText.Text = string.IsNullOrWhiteSpace(Initials) ? "?" : Initials;
        PreviewImage.Source = BrandingImageHelper.TryCreateImageSource(AvatarUrl);
        var hasImage = PreviewImage.Source != null;
        PreviewImage.Visibility = hasImage ? Visibility.Visible : Visibility.Collapsed;
        InitialsText.Visibility = hasImage ? Visibility.Collapsed : Visibility.Visible;
    }
}
