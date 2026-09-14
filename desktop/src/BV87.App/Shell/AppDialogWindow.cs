using System.Windows;
using BV87.App.Branding;

namespace BV87.App.Shell;

/// <summary>Module dialogs: Window.Icon is a Segoe MDL2 glyph (D-UI.35).</summary>
public class AppDialogWindow : Window
{
    protected AppDialogWindow()
    {
        Initialized += (_, _) => WindowBrandingHelper.ApplyForWindow(this);
    }
}
