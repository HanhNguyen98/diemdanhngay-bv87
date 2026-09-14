using System.Windows;
using System.Windows.Controls;
using BV87.App.Shell;
using BV87.Core.Constants;
using BV87.Core.Models.Admin;

namespace BV87.App.Views.Settings;

public partial class KioskTokenIssueDialog : AppDialogWindow
{
    public KioskTokenIssueDialog(IReadOnlyList<DepartmentListItem> departments)
    {
        InitializeComponent();
        DeptCombo.ItemsSource = departments;
        if (departments.Count > 0)
        {
            DeptCombo.SelectedIndex = 0;
        }
    }

    public int? SelectedDeptCode => (DeptCombo.SelectedItem as DepartmentListItem)?.DeptCode;
    public string? LabelText => string.IsNullOrWhiteSpace(LabelBox.Text) ? null : LabelBox.Text.Trim();

    private void Issue_Click(object sender, RoutedEventArgs e)
    {
        if (SelectedDeptCode == null)
        {
            ShowError(SettingsUiStrings.KioskTokens.DeptRequired);
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
