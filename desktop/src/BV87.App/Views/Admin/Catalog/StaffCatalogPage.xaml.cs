using System;
using System.Windows;
using System.Windows.Controls;
using BV87.App.Controls;
using BV87.App.Helpers;
using BV87.App.ViewModels;
using BV87.Core.Constants;

namespace BV87.App.Views.Admin.Catalog;

public partial class StaffCatalogPage : UserControl
{
    private StaffCatalogViewModel? _viewModel;

    public StaffCatalogPage()
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

        _viewModel = new StaffCatalogViewModel(App.AdminApi);
        _viewModel.FormRequested += OnFormRequested;
        _viewModel.TransferRequested += OnTransferRequested;
        _viewModel.HistoryRequested += OnHistoryRequested;
        _viewModel.DeleteRequested += OnDeleteRequested;
        _viewModel.DeleteFingerprintRequested += OnDeleteFingerprintRequested;
        DataContext = _viewModel;
    }

    private void OnFormRequested(object? sender, StaffCatalogRowViewModel? row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var dialog = new StaffCatalogFormDialog(_viewModel, row)
        {
            Owner = Window.GetWindow(this)
        };
        dialog.ShowDialog();
    }

    private void OnTransferRequested(object? sender, StaffCatalogRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var dialog = new StaffTransferDialog(_viewModel, row)
        {
            Owner = Window.GetWindow(this)
        };
        dialog.ShowDialog();
    }

    private void OnHistoryRequested(object? sender, StaffCatalogRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var dialog = new StaffTransferHistoryDialog(_viewModel, row)
        {
            Owner = Window.GetWindow(this)
        };
        dialog.ShowDialog();
    }

    private async void OnDeleteRequested(object? sender, StaffCatalogRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var result = AppMessageBox.Show(
            CatalogUiStrings.Staff.DeleteMessage(row.Fullname),
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (result != MessageBoxResult.Yes)
        {
            return;
        }

        await _viewModel.DeleteStaffAsync(row);
    }

    private async void OnDeleteFingerprintRequested(object? sender, StaffCatalogRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var result = AppMessageBox.Show(
            CatalogUiStrings.Staff.FingerprintDeleteMessage(row.Fullname, row.FingerLabel),
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (result != MessageBoxResult.Yes)
        {
            return;
        }

        await _viewModel.DeleteFingerprintAsync(row);
    }

    private void ActionsMenuButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button button || button.Tag is not StaffCatalogRowViewModel row || _viewModel == null)
        {
            return;
        }

        var menu = new ContextMenu();
        menu.Items.Add(CreateActionItem(CatalogUiStrings.Staff.EditAction, () => ExecuteEdit(row)));
        menu.Items.Add(CreateActionItem(CatalogUiStrings.Staff.AvatarAction, () => ExecuteAvatar(row)));
        menu.Items.Add(CreateActionItem(CatalogUiStrings.Staff.TransferAction, () => ExecuteTransfer(row)));
        menu.Items.Add(CreateActionItem(CatalogUiStrings.Staff.HistoryAction, () => ExecuteHistory(row)));

        var fingerprintItem = CreateActionItem(
            CatalogUiStrings.Staff.FingerprintDeleteLabel,
            () => ExecuteDeleteFingerprint(row));
        fingerprintItem.IsEnabled = row.FingerprintRegistered;
        menu.Items.Add(fingerprintItem);

        menu.Items.Add(CreateActionItem(CatalogUiStrings.Staff.DeleteAction, () => ExecuteDelete(row)));

        menu.PlacementTarget = button;
        menu.IsOpen = true;
    }

    private static MenuItem CreateActionItem(string header, Action action)
    {
        var item = new MenuItem { Header = header };
        item.Click += (_, _) => action();
        return item;
    }

    private void ExecuteEdit(StaffCatalogRowViewModel row)
    {
        if (_viewModel?.EditCommand.CanExecute(row) == true)
        {
            _viewModel.EditCommand.Execute(row);
        }
    }

    private async void ExecuteAvatar(StaffCatalogRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var dialog = new StaffAvatarDialog(row.Fullname, row.EmpCodeFormatted ?? row.EmpCode.ToString("D5"), row.AvatarUrl)
        {
            Owner = Window.GetWindow(this)
        };
        if (dialog.ShowDialog() != true)
        {
            return;
        }

        try
        {
            await _viewModel.SaveStaffAsync(new Core.Models.Admin.Catalog.StaffUpsertRequest
            {
                Fullname = row.Fullname,
                DeptCode = row.DeptCode ?? 0,
                RankName = row.RankName,
                PositionName = row.PositionName,
                Active = row.Active,
                AvatarUrl = dialog.AvatarUrl
            }, row.EmpCode);
        }
        catch
        {
            /* error shown on view-model */
        }
    }

    private void ExecuteTransfer(StaffCatalogRowViewModel row)
    {
        if (_viewModel?.TransferCommand.CanExecute(row) == true)
        {
            _viewModel.TransferCommand.Execute(row);
        }
    }

    private void ExecuteHistory(StaffCatalogRowViewModel row)
    {
        if (_viewModel?.HistoryCommand.CanExecute(row) == true)
        {
            _viewModel.HistoryCommand.Execute(row);
        }
    }

    private void ExecuteDelete(StaffCatalogRowViewModel row)
    {
        if (_viewModel?.DeleteCommand.CanExecute(row) == true)
        {
            _viewModel.DeleteCommand.Execute(row);
        }
    }

    private void ExecuteDeleteFingerprint(StaffCatalogRowViewModel row)
    {
        if (_viewModel?.DeleteFingerprintCommand.CanExecute(row) == true)
        {
            _viewModel.DeleteFingerprintCommand.Execute(row);
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
