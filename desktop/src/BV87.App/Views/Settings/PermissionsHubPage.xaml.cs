using System.Windows.Controls;

namespace BV87.App.Views.Settings;

/// <summary>Phân quyền hub — Tab Tài khoản / Nhóm quyền (D-ACL.2d).</summary>
public partial class PermissionsHubPage : UserControl
{
    public PermissionsHubPage(int initialTabIndex = 0)
    {
        InitializeComponent();
        if (initialTabIndex >= 0 && initialTabIndex < HubTabs.Items.Count)
        {
            HubTabs.SelectedIndex = initialTabIndex;
        }
    }
}
