using System.Windows;
using System.Windows.Controls;
using BV87.App.Controls;
using BV87.App.Helpers;
using BV87.App.ViewModels;
using BV87.Core.Constants;

namespace BV87.App.Views.Admin.Catalog;

public partial class DepartmentCatalogPage : UserControl
{
    private DepartmentCatalogViewModel? _viewModel;

    public DepartmentCatalogPage()
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

        _viewModel = new DepartmentCatalogViewModel(App.AdminApi);
        _viewModel.FormRequested += OnFormRequested;
        _viewModel.DeleteRequested += OnDeleteRequested;
        _viewModel.ManageGroupsRequested += OnManageGroupsRequested;
        _viewModel.PropertyChanged += (_, args) =>
        {
            if (args.PropertyName == nameof(DepartmentCatalogViewModel.ShowGroupColumn))
            {
                UpdateGroupColumnVisibility();
            }
        };
        DataContext = _viewModel;
        UpdateGroupColumnVisibility();
    }

    private void UpdateGroupColumnVisibility()
    {
        if (_viewModel == null)
        {
            return;
        }

        GroupColumn.Visibility = _viewModel.ShowGroupColumn ? Visibility.Visible : Visibility.Collapsed;
    }

    private void OnFormRequested(object? sender, DepartmentCatalogRowViewModel? row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var dialog = new DepartmentCatalogFormDialog(_viewModel, row)
        {
            Owner = Window.GetWindow(this)
        };
        dialog.ShowDialog();
    }

    private async void OnDeleteRequested(object? sender, DepartmentCatalogRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var result = AppMessageBox.Show(
            CatalogUiStrings.Departments.DeleteMessage(row.DisplayName),
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (result != MessageBoxResult.Yes)
        {
            return;
        }

        await _viewModel.DeleteDepartmentAsync(row);
    }

    private void OnManageGroupsRequested(object? sender, EventArgs e)
    {
        if (_viewModel == null)
        {
            return;
        }

        var dialog = new DepartmentGroupManageDialog(_viewModel)
        {
            Owner = Window.GetWindow(this)
        };
        dialog.ShowDialog();
    }

    private void EditButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button { Tag: DepartmentCatalogRowViewModel row } && _viewModel?.EditCommand.CanExecute(row) == true)
        {
            _viewModel.EditCommand.Execute(row);
        }
    }

    private void DeleteButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button { Tag: DepartmentCatalogRowViewModel row })
        {
            return;
        }

        if (!row.CanDelete)
        {
            AppMessageBox.Show(
                CatalogUiStrings.Departments.DeleteBlocked(row.StaffCount),
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            return;
        }

        if (_viewModel?.DeleteCommand.CanExecute(row) == true)
        {
            _viewModel.DeleteCommand.Execute(row);
        }
    }

    private void ExcelMenu_TemplateRequested(object sender, RoutedEventArgs e)
    {
        if (_viewModel == null)
        {
            return;
        }

        ExcelSaveHelper.SaveExcelFile(
            Window.GetWindow(this),
            _viewModel.ExcelConfig.TemplateFilename,
            ExcelUiStrings.Template,
            _viewModel.DownloadTemplate);
    }

    private async void ExcelMenu_ImportFileSelected(object sender, ExcelFilePathEventArgs e)
    {
        if (_viewModel == null)
        {
            return;
        }

        await _viewModel.ImportFromFileAsync(e.FilePath);
    }

    private void ExcelMenu_ExportRequested(object sender, RoutedEventArgs e)
    {
        if (_viewModel == null)
        {
            return;
        }

        ExcelSaveHelper.SaveExcelFile(
            Window.GetWindow(this),
            _viewModel.ExcelConfig.ExportFilename,
            ExcelUiStrings.Export,
            _viewModel.ExportToFile);
    }
}
