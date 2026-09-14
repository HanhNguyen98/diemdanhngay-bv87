using System.Windows;
using BV87.App.Shell;
using BV87.App.Helpers;
using BV87.App.ViewModels;
using BV87.Core.Constants;

namespace BV87.App.Views.Admin.Catalog;

public partial class DepartmentGroupManageDialog : AppDialogWindow
{
    private readonly DepartmentCatalogViewModel _viewModel;

    public DepartmentGroupManageDialog(DepartmentCatalogViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        RefreshGroups();
    }

    private void RefreshGroups()
    {
        GroupsGrid.ItemsSource = _viewModel.GetGroupRows();
    }

    private void AddGroup_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new DepartmentGroupFormDialog(_viewModel, null) { Owner = this };
        if (dialog.ShowDialog() == true)
        {
            RefreshGroups();
        }
    }

    private void EditGroup_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not System.Windows.Controls.Button { Tag: DepartmentGroupRowViewModel row })
        {
            return;
        }

        var dialog = new DepartmentGroupFormDialog(_viewModel, row) { Owner = this };
        if (dialog.ShowDialog() == true)
        {
            RefreshGroups();
        }
    }

    private async void DeleteGroup_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not System.Windows.Controls.Button { Tag: DepartmentGroupRowViewModel row })
        {
            return;
        }

        if (!row.CanDelete)
        {
            AppMessageBox.Show(
                this,
                CatalogUiStrings.DepartmentGroups.DeleteBlocked(row.DeptCount),
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            return;
        }

        var result = AppMessageBox.Show(
            this,
            CatalogUiStrings.DepartmentGroups.DeleteMessage(row.GroupName),
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (result != MessageBoxResult.Yes)
        {
            return;
        }

        try
        {
            await _viewModel.DeleteGroupAsync(row);
            RefreshGroups();
        }
        catch (Exception ex)
        {
            AppMessageBox.Show(
                this,
                ex.Message.Trim('"', ' '),
                MessageBoxButton.OK,
                MessageBoxImage.Error);
        }
    }

    private void Close_Click(object sender, RoutedEventArgs e) => Close();
}
