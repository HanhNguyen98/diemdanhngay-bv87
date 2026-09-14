using System.Windows;
using BV87.Core.Constants;

namespace BV87.App.Helpers;

/// <summary>D-UI.34 — system MessageBox titles: CẢNH BÁO or XÁC NHẬN, never BV87.</summary>
public static class AppMessageBox
{
    public static MessageBoxResult Show(
        string message,
        MessageBoxButton button = MessageBoxButton.OK,
        MessageBoxImage image = MessageBoxImage.Warning)
        => Show(null, message, button, image);

    public static MessageBoxResult Show(
        Window? owner,
        string message,
        MessageBoxButton button = MessageBoxButton.OK,
        MessageBoxImage image = MessageBoxImage.Warning)
    {
        var title = IsConfirm(button)
            ? ShellUiStrings.MessageBoxConfirm
            : ShellUiStrings.MessageBoxWarning;
        return owner == null
            ? MessageBox.Show(message, title, button, image)
            : MessageBox.Show(owner, message, title, button, image);
    }

    private static bool IsConfirm(MessageBoxButton button) =>
        button is MessageBoxButton.YesNo
            or MessageBoxButton.YesNoCancel
            or MessageBoxButton.OKCancel;
}
