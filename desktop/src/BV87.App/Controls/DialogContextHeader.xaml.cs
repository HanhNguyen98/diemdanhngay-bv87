using System.Windows;
using System.Windows.Controls;

namespace BV87.App.Controls;

/// <summary>Centered in-card dialog context — D-UI.61. Window.Title holds the action; this confirms person/entity context.</summary>
public partial class DialogContextHeader : UserControl
{
    public static readonly DependencyProperty PrimaryTextProperty =
        DependencyProperty.Register(
            nameof(PrimaryText),
            typeof(string),
            typeof(DialogContextHeader),
            new PropertyMetadata(string.Empty));

    public static readonly DependencyProperty SecondaryTextProperty =
        DependencyProperty.Register(
            nameof(SecondaryText),
            typeof(string),
            typeof(DialogContextHeader),
            new PropertyMetadata(string.Empty));

    public DialogContextHeader()
    {
        InitializeComponent();
    }

    public string PrimaryText
    {
        get => (string)GetValue(PrimaryTextProperty);
        set => SetValue(PrimaryTextProperty, value);
    }

    public string SecondaryText
    {
        get => (string)GetValue(SecondaryTextProperty);
        set => SetValue(SecondaryTextProperty, value);
    }
}
