using System.Windows;
using BV87.App.Helpers;
using BV87.App.Shell;
using BV87.Core.Constants;

namespace BV87.App.Views.Admin.Utilities;

public partial class UnlockRejectDialog : AppDialogWindow
{
    public UnlockRejectDialog()
    {
        InitializeComponent();
        Title = UtilitiesUiStrings.UnlockRequests.RejectTitle;
        DialogContextHeaderHelper.SetBadge(ContextHeader, UtilitiesUiStrings.UnlockRequests.RejectBadge);
        HintText.Text = UtilitiesUiStrings.UnlockRequests.RejectHint;
        NoteBox.SetValue(System.Windows.Controls.ToolTipService.ToolTipProperty, UtilitiesUiStrings.UnlockRequests.RejectPlaceholder);
    }

    public string? Note { get; private set; }

    private void CancelButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void RejectButton_Click(object sender, RoutedEventArgs e)
    {
        Note = string.IsNullOrWhiteSpace(NoteBox.Text) ? null : NoteBox.Text.Trim();
        DialogResult = true;
        Close();
    }
}
