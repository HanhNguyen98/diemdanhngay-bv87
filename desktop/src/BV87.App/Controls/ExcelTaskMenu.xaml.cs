using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Media;
using BV87.Core.Constants;
using Microsoft.Win32;

namespace BV87.App.Controls;

public partial class ExcelTaskMenu : UserControl
{
    public static readonly RoutedEvent TemplateRequestedEvent = EventManager.RegisterRoutedEvent(
        nameof(TemplateRequested), RoutingStrategy.Bubble, typeof(RoutedEventHandler), typeof(ExcelTaskMenu));

    public static readonly RoutedEvent ImportFileSelectedEvent = EventManager.RegisterRoutedEvent(
        nameof(ImportFileSelected), RoutingStrategy.Bubble, typeof(ExcelFilePathEventHandler), typeof(ExcelTaskMenu));

    public static readonly RoutedEvent ExportRequestedEvent = EventManager.RegisterRoutedEvent(
        nameof(ExportRequested), RoutingStrategy.Bubble, typeof(RoutedEventHandler), typeof(ExcelTaskMenu));

    public static readonly DependencyProperty IsImportingProperty = DependencyProperty.Register(
        nameof(IsImporting), typeof(bool), typeof(ExcelTaskMenu), new PropertyMetadata(false, OnImportingChanged));

    public ExcelTaskMenu()
    {
        InitializeComponent();
    }

    public bool IsImporting
    {
        get => (bool)GetValue(IsImportingProperty);
        set => SetValue(IsImportingProperty, value);
    }

    public event RoutedEventHandler TemplateRequested
    {
        add => AddHandler(TemplateRequestedEvent, value);
        remove => RemoveHandler(TemplateRequestedEvent, value);
    }

    public event ExcelFilePathEventHandler ImportFileSelected
    {
        add => AddHandler(ImportFileSelectedEvent, value);
        remove => RemoveHandler(ImportFileSelectedEvent, value);
    }

    public event RoutedEventHandler ExportRequested
    {
        add => AddHandler(ExportRequestedEvent, value);
        remove => RemoveHandler(ExportRequestedEvent, value);
    }

    private static void OnImportingChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is ExcelTaskMenu menu)
        {
            menu.UpdateImportingState();
        }
    }

    private void UpdateImportingState()
    {
        MenuLabelText.Text = IsImporting ? ExcelUiStrings.Importing : ExcelUiStrings.MenuLabel;
        MenuButton.IsEnabled = IsEnabled && !IsImporting;
    }

    protected override void OnPropertyChanged(DependencyPropertyChangedEventArgs e)
    {
        base.OnPropertyChanged(e);

        if (e.Property == IsEnabledProperty)
        {
            UpdateImportingState();
        }
    }

    private void MenuButton_Checked(object sender, RoutedEventArgs e)
    {
        ChevronRotate.Angle = 180;
        MenuPopup.IsOpen = true;
    }

    private void MenuButton_Unchecked(object sender, RoutedEventArgs e)
    {
        ChevronRotate.Angle = 0;
        MenuPopup.IsOpen = false;
    }

    private void CloseMenu()
    {
        MenuButton.IsChecked = false;
        MenuPopup.IsOpen = false;
    }

    private void TemplateButton_Click(object sender, RoutedEventArgs e)
    {
        CloseMenu();
        RaiseEvent(new RoutedEventArgs(TemplateRequestedEvent));
    }

    private void ImportButton_Click(object sender, RoutedEventArgs e)
    {
        CloseMenu();

        var dialog = new OpenFileDialog
        {
            Filter = "Excel (*.xlsx;*.xls)|*.xlsx;*.xls",
            Title = ExcelUiStrings.Import
        };

        if (dialog.ShowDialog() != true)
        {
            return;
        }

        RaiseEvent(new ExcelFilePathEventArgs(ImportFileSelectedEvent, dialog.FileName));
    }

    private void ExportButton_Click(object sender, RoutedEventArgs e)
    {
        CloseMenu();
        RaiseEvent(new RoutedEventArgs(ExportRequestedEvent));
    }
}
