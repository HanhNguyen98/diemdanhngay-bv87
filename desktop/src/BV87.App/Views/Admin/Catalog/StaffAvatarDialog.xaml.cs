using System.Windows;
using BV87.App.Branding;
using BV87.App.Shell;
using BV87.Core.Helpers;
using Microsoft.Win32;

namespace BV87.App.Views.Admin.Catalog;

public partial class StaffAvatarDialog : AppDialogWindow
{
    public StaffAvatarDialog(string fullname, string empCodeFormatted, string? avatarUrl)
    {
        InitializeComponent();
        StaffText.Text = $"{fullname} · {empCodeFormatted}";
        AvatarUrl = string.IsNullOrWhiteSpace(avatarUrl) ? null : avatarUrl;
        InitialsText.Text = Initials(fullname);
        RenderPreview();
    }

    public string? AvatarUrl { get; private set; }

    private async void Pick_Click(object sender, RoutedEventArgs e)
    {
        HideError();
        var dialog = new OpenFileDialog
        {
            Title = Core.Constants.CatalogUiStrings.Staff.AvatarPick,
            Filter = "Ảnh JPG/PNG/GIF/WEBP|*.jpg;*.jpeg;*.png;*.gif;*.webp;*.JPG;*.JPEG;*.PNG;*.GIF;*.WEBP",
            Multiselect = false,
            CheckFileExists = true
        };

        if (dialog.ShowDialog(this) != true)
        {
            return;
        }

        try
        {
            AvatarUrl = await ImageDataUrlHelper.ReadAsDataUrlAsync(dialog.FileName);
            RenderPreview();
        }
        catch (Exception ex)
        {
            ShowError(ex.Message);
        }
    }

    private void Remove_Click(object sender, RoutedEventArgs e)
    {
        HideError();
        AvatarUrl = null;
        RenderPreview();
    }

    private void Save_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = true;
        Close();
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void RenderPreview()
    {
        var hasUrl = !string.IsNullOrWhiteSpace(AvatarUrl);
        ClearButton.Visibility = hasUrl ? Visibility.Visible : Visibility.Collapsed;

        if (!hasUrl)
        {
            PreviewImage.Source = null;
            PreviewImage.Visibility = Visibility.Collapsed;
            InitialsText.Visibility = Visibility.Visible;
            return;
        }

        try
        {
            PreviewImage.Source = BrandingImageHelper.TryCreateImageSource(AvatarUrl);
            var hasImage = PreviewImage.Source != null;
            PreviewImage.Visibility = hasImage ? Visibility.Visible : Visibility.Collapsed;
            InitialsText.Visibility = hasImage ? Visibility.Collapsed : Visibility.Visible;
            ClearButton.Visibility = hasImage ? Visibility.Visible : Visibility.Collapsed;
        }
        catch
        {
            PreviewImage.Source = null;
            PreviewImage.Visibility = Visibility.Collapsed;
            InitialsText.Visibility = Visibility.Visible;
            ClearButton.Visibility = Visibility.Collapsed;
        }
    }

    private void ShowError(string message)
    {
        ErrorText.Text = message;
        ErrorText.Visibility = Visibility.Visible;
    }

    private void HideError()
    {
        ErrorText.Visibility = Visibility.Collapsed;
    }

    private static string Initials(string fullname)
    {
        var parts = fullname.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0)
        {
            return "?";
        }

        if (parts.Length == 1)
        {
            return parts[0][..Math.Min(2, parts[0].Length)].ToUpperInvariant();
        }

        return string.Concat(parts[0][0], parts[^1][0]).ToUpperInvariant();
    }
}
