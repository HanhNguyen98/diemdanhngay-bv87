using System.Windows;

namespace BV87.App.Controls;

public sealed class ExcelFilePathEventArgs : RoutedEventArgs
{
    public ExcelFilePathEventArgs(RoutedEvent routedEvent, string filePath)
        : base(routedEvent)
    {
        FilePath = filePath;
    }

    public string FilePath { get; }
}

public delegate void ExcelFilePathEventHandler(object sender, ExcelFilePathEventArgs e);
