using System.Diagnostics;
using System.IO;
using System.Windows;
using BV87.Core.Constants;
using Microsoft.Win32;

namespace BV87.App.Helpers;

/// <summary>Shared SaveFileDialog + post-download success/open prompt for Excel template and export — §2.16.3.</summary>
public static class ExcelSaveHelper
{
    public static void SaveExcelFile(
        Window? owner,
        string defaultFileName,
        string dialogTitle,
        Action<string> writeFile)
    {
        var dialog = new SaveFileDialog
        {
            FileName = defaultFileName,
            Filter = "Excel (*.xlsx)|*.xlsx",
            Title = dialogTitle
        };

        if (dialog.ShowDialog() != true)
        {
            return;
        }

        try
        {
            writeFile(dialog.FileName);
        }
        catch (Exception ex)
        {
            AppMessageBox.Show(
                owner,
                ResolveDownloadErrorMessage(ex),
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            return;
        }

        PromptOpenSavedFile(owner, dialog.FileName);
    }

    private static string ResolveDownloadErrorMessage(Exception ex) =>
        IsFileLockedException(ex) ? ExcelUiStrings.DownloadFileLocked : ExcelUiStrings.DownloadFail;

    private static bool IsFileLockedException(Exception ex)
    {
        for (var current = ex; current != null; current = current.InnerException)
        {
            if (current is not IOException ioEx)
            {
                continue;
            }

            const int sharingViolationHResult = unchecked((int)0x80070020);
            if (ioEx.HResult == sharingViolationHResult)
            {
                return true;
            }

            if (ioEx.Message.Contains("being used by another process", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static void PromptOpenSavedFile(Window? owner, string filePath)
    {
        var openFile = AppMessageBox.Show(
            owner,
            ExcelUiStrings.DownloadSuccessMessage(Path.GetFileName(filePath)),
            MessageBoxButton.YesNo,
            MessageBoxImage.Information);

        if (openFile != MessageBoxResult.Yes)
        {
            return;
        }

        try
        {
            Process.Start(new ProcessStartInfo(filePath) { UseShellExecute = true });
        }
        catch
        {
            AppMessageBox.Show(
                owner,
                ExcelUiStrings.OpenFileFail,
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
        }
    }
}
