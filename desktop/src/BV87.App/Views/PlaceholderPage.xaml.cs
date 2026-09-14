using System.Windows.Controls;

namespace BV87.App.Views;

public partial class PlaceholderPage : UserControl
{
    public PlaceholderPage()
    {
        InitializeComponent();
    }

    public PlaceholderPage(string title, string description) : this()
    {
        SetContent(title, description);
    }

    public void SetContent(string title, string description)
    {
        TitleText.Text = title;
        DescriptionText.Text = description;
    }
}
