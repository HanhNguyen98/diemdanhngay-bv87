using System.Windows;
using BV87.App.Helpers;
using BV87.App.Shell;
using BV87.Core.Constants;

namespace BV87.App.Views.Admin.Utilities;

public partial class FingerLabelDialog : AppDialogWindow
{
    public FingerLabelDialog()
    {
        InitializeComponent();
        Title = UtilitiesUiStrings.FingerprintEnroll.FingerLabelTitle;
        DialogContextHeaderHelper.SetBadge(ContextHeader, UtilitiesUiStrings.FingerprintEnroll.FingerLabelBadge);
        HintBlock.Text = UtilitiesUiStrings.FingerprintEnroll.FingerLabelHint;
        LabelBox.Focus();
    }

    public string? FingerLabel { get; private set; }

    private void SaveButton_Click(object sender, RoutedEventArgs e)
    {
        var label = LabelBox.Text.Trim();
        if (string.IsNullOrWhiteSpace(label))
        {
            AppMessageBox.Show(
                this,
                UtilitiesUiStrings.FingerprintEnroll.FingerLabelRequired,
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        FingerLabel = label;
        DialogResult = true;
        Close();
    }

    private void CancelButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }
}
