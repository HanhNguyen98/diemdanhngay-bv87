using System.Windows;
using BV87.App.Helpers;
using BV87.App.Shell;

namespace BV87.App.Views.Head;

public partial class SimpleInputDialog : AppDialogWindow
{
    public SimpleInputDialog(string title, string prompt)
    {
        InitializeComponent();
        Title = title;
        DialogContextHeaderHelper.SetBadge(ContextHeader, title);
        PromptText.Text = prompt;
    }

    public string? InputText { get; private set; }

    private void CancelButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void SaveButton_Click(object sender, RoutedEventArgs e)
    {
        if (string.IsNullOrWhiteSpace(InputBox.Text))
        {
            AppMessageBox.Show(this, "Nội dung không được để trống.", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        InputText = InputBox.Text.Trim();
        DialogResult = true;
        Close();
    }
}
