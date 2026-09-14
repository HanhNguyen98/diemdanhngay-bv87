using System.Windows;
using System.Windows.Controls;
using BV87.App.ViewModels.Utilities;

namespace BV87.App.Views.Admin.Utilities;

public partial class FingerprintHistoryPage : UserControl
{
    public FingerprintHistoryPage()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        if (DataContext != null)
        {
            return;
        }

        DataContext = new FingerprintHistoryViewModel(App.AdminApi);
    }
}
