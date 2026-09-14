using System.Windows;
using BV87.App.Shell;
using BV87.Core.Constants;

namespace BV87.App.Views.Settings;

public partial class KioskTokenLabelDialog : AppDialogWindow
{
    public KioskTokenLabelDialog(string? initialLabel)
    {
        InitializeComponent();
        LabelBox.Text = initialLabel ?? string.Empty;
    }

    public string Label => LabelBox.Text.Trim();

    private void Save_Click(object sender, RoutedEventArgs e)
    {
        if (string.IsNullOrWhiteSpace(Label) || Label.Length > 100)
        {
            ShowError(SettingsUiStrings.KioskTokens.RenameLabelRequired);
            return;
        }

        DialogResult = true;
        Close();
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void ShowError(string message)
    {
        ErrorText.Text = message;
        ErrorText.Visibility = Visibility.Visible;
    }
}
