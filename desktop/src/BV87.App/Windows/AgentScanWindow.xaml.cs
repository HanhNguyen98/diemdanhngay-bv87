using System.Windows;
using BV87.App.Branding;

namespace BV87.App.Windows;

public partial class AgentScanWindow : Window
{
    public AgentScanWindow()
    {
        InitializeComponent();
        WindowBrandingHelper.ApplyHospitalIcon(this);
        Closed += OnClosed;
    }

    private void OnClosed(object? sender, EventArgs e)
    {
        if (DataContext is IDisposable disposable)
        {
            disposable.Dispose();
        }
    }
}
