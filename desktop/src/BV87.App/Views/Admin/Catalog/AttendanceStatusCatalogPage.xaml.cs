using System.Windows;
using System.Windows.Controls;
using BV87.App.Controls;
using BV87.App.Helpers;
using BV87.App.ViewModels;
using BV87.Core.Constants;

namespace BV87.App.Views.Admin.Catalog;

public partial class AttendanceStatusCatalogPage : UserControl
{
    private StatusCatalogViewModel? _viewModel;

    public AttendanceStatusCatalogPage()
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

        _viewModel = new StatusCatalogViewModel(App.AdminApi);
        _viewModel.FormRequested += OnFormRequested;
        _viewModel.DeleteRequested += OnDeleteRequested;
        DataContext = _viewModel;
    }

    private void OnFormRequested(object? sender, StatusCatalogRowViewModel? row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var owner = Window.GetWindow(this);
        var dialog = new AttendanceStatusCatalogFormDialog(_viewModel, row)
        {
            Owner = owner
        };
        dialog.ShowDialog();
    }

    private async void OnDeleteRequested(object? sender, StatusCatalogRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var result = AppMessageBox.Show(
            CatalogUiStrings.StatusCatalog.DeleteMessage(row.Label),
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (result != MessageBoxResult.Yes)
        {
            return;
        }

        await _viewModel.DeleteItemAsync(row);
    }

    private void EditButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button { Tag: StatusCatalogRowViewModel row } && _viewModel?.EditCommand.CanExecute(row) == true)
        {
            _viewModel.EditCommand.Execute(row);
        }
    }

    private void DeleteButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button { Tag: StatusCatalogRowViewModel row })
        {
            return;
        }

        if (!row.CanDelete)
        {
            AppMessageBox.Show(
                CatalogUiStrings.StatusCatalog.DeleteBlocked(row.UsageCount),
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
