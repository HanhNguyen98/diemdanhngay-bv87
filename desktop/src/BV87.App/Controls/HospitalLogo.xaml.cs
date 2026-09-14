using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using BV87.App.Branding;

namespace BV87.App.Controls;

public partial class HospitalLogo : UserControl
{
    public static readonly DependencyProperty LogoSizeProperty =
        DependencyProperty.Register(nameof(LogoSize), typeof(double), typeof(HospitalLogo), new PropertyMetadata(40.0));

    public static readonly DependencyProperty LayoutProperty =
        DependencyProperty.Register(nameof(Layout), typeof(Orientation), typeof(HospitalLogo), new PropertyMetadata(Orientation.Horizontal));

    public static readonly DependencyProperty ShowAppSubtitleProperty =
        DependencyProperty.Register(nameof(ShowAppSubtitle), typeof(bool), typeof(HospitalLogo), new PropertyMetadata(true));

    public static readonly DependencyProperty ShowHospitalNameProperty =
        DependencyProperty.Register(nameof(ShowHospitalName), typeof(bool), typeof(HospitalLogo), new PropertyMetadata(true));

    public static readonly DependencyProperty AppSubtitleProperty =
        DependencyProperty.Register(nameof(AppSubtitle), typeof(string), typeof(HospitalLogo), new PropertyMetadata(HospitalBranding.AppSubtitle));

    public static readonly DependencyProperty HospitalNameProperty =
        DependencyProperty.Register(nameof(HospitalName), typeof(string), typeof(HospitalLogo), new PropertyMetadata(HospitalBranding.HospitalName));

    public static readonly DependencyProperty SubtitleFontSizeProperty =
        DependencyProperty.Register(nameof(SubtitleFontSize), typeof(double), typeof(HospitalLogo), new PropertyMetadata(14.0));

    public static readonly DependencyProperty HospitalNameFontSizeProperty =
        DependencyProperty.Register(nameof(HospitalNameFontSize), typeof(double), typeof(HospitalLogo), new PropertyMetadata(12.0));

    public static readonly DependencyProperty HospitalNameFontWeightProperty =
        DependencyProperty.Register(nameof(HospitalNameFontWeight), typeof(FontWeight), typeof(HospitalLogo), new PropertyMetadata(FontWeights.Normal));

    public static readonly DependencyProperty TextMarginProperty =
        DependencyProperty.Register(nameof(TextMargin), typeof(Thickness), typeof(HospitalLogo), new PropertyMetadata(new Thickness(10, 0, 0, 0)));

    public static readonly DependencyProperty LogoSourceProperty =
        DependencyProperty.Register(nameof(LogoSource), typeof(ImageSource), typeof(HospitalLogo),
            new PropertyMetadata(CreateDefaultLogo()));

    public HospitalLogo()
    {
        InitializeComponent();
    }

    public double LogoSize
    {
        get => (double)GetValue(LogoSizeProperty);
        set => SetValue(LogoSizeProperty, value);
    }

    public Orientation Layout
    {
        get => (Orientation)GetValue(LayoutProperty);
        set => SetValue(LayoutProperty, value);
    }

    public bool ShowAppSubtitle
    {
        get => (bool)GetValue(ShowAppSubtitleProperty);
        set => SetValue(ShowAppSubtitleProperty, value);
    }

    public bool ShowHospitalName
    {
        get => (bool)GetValue(ShowHospitalNameProperty);
        set => SetValue(ShowHospitalNameProperty, value);
    }

    public string AppSubtitle
    {
        get => (string)GetValue(AppSubtitleProperty);
        set => SetValue(AppSubtitleProperty, value);
    }

    public string HospitalName
    {
        get => (string)GetValue(HospitalNameProperty);
        set => SetValue(HospitalNameProperty, value);
    }

    public double SubtitleFontSize
    {
        get => (double)GetValue(SubtitleFontSizeProperty);
        set => SetValue(SubtitleFontSizeProperty, value);
    }

    public double HospitalNameFontSize
    {
        get => (double)GetValue(HospitalNameFontSizeProperty);
        set => SetValue(HospitalNameFontSizeProperty, value);
    }

    public FontWeight HospitalNameFontWeight
    {
        get => (FontWeight)GetValue(HospitalNameFontWeightProperty);
        set => SetValue(HospitalNameFontWeightProperty, value);
    }

    public Thickness TextMargin
    {
        get => (Thickness)GetValue(TextMarginProperty);
        set => SetValue(TextMarginProperty, value);
    }

    public ImageSource LogoSource
    {
        get => (ImageSource)GetValue(LogoSourceProperty);
        set => SetValue(LogoSourceProperty, value);
    }

    private static ImageSource CreateDefaultLogo() =>
        new BitmapImage(new Uri($"pack://application:,,,{HospitalBranding.LogoResourcePath}", UriKind.Absolute));
}
