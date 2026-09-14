using System.Windows;
using BV87.App.Shell;
using BV87.Core.Constants;

namespace BV87.App.Views.Settings;

public partial class KioskTokenIssuedDialog : AppDialogWindow
{
    public KioskTokenIssuedDialog(string token)
    {
        InitializeComponent();
        TokenBox.Text = token;
    }

    private void Copy_Click(object sender, RoutedEventArgs e)
    {
        if (!string.IsNullOrWhiteSpace(TokenBox.Text))
        {
            Clipboard.SetText(TokenBox.Text);
            StatusText.Text = SettingsUiStrings.Copied;
        }
    }

    private void Close_Click(object sender, RoutedEventArgs e)
    {
        Close();
    }
}
