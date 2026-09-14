using System;
using System.Windows;
using System.Windows.Controls;
using BV87.App.Helpers;
using BV87.App.ViewModels;
using BV87.App.Views.Admin.Catalog;
using BV87.Core.Constants;

namespace BV87.App.Views.Head;

public partial class HeadStaffFingerprintPage : UserControl
{
    private HeadStaffFingerprintViewModel? _viewModel;

    public HeadStaffFingerprintPage()
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

        _viewModel = new HeadStaffFingerprintViewModel(App.HeadApi);
        _viewModel.DeleteFingerprintRequested += OnDeleteFingerprintRequested;
        _viewModel.EditAvatarRequested += OnEditAvatarRequested;
        DataContext = _viewModel;
    }

    private async void OnDeleteFingerprintRequested(object? sender, HeadStaffFingerprintRowViewModel row)
    {
        if (_viewModel == null || !row.Registered)
        {
            return;
        }

        var result = AppMessageBox.Show(
            CatalogUiStrings.Staff.FingerprintDeleteMessage(row.Fullname, row.RawFingerLabel),
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (result != MessageBoxResult.Yes)
        {
            return;
        }

        await _viewModel.DeleteFingerprintAsync(row);
    }

    private async void OnEditAvatarRequested(object? sender, HeadStaffFingerprintRowViewModel row)
    {
        if (_viewModel == null)
        {
            return;
        }

        var dialog = new StaffAvatarDialog(row.Fullname, row.EmpCodeFormatted, row.AvatarUrl)
        {
            Owner = Window.GetWindow(this)
        };
        if (dialog.ShowDialog() != true)
        {
            return;
        }

        await _viewModel.UpdateAvatarAsync(row, dialog.AvatarUrl);
    }

    private void ActionsMenuButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button button || button.Tag is not HeadStaffFingerprintRowViewModel row || _viewModel == null)
        {
            return;
        }

        var menu = new ContextMenu();
        menu.Items.Add(CreateActionItem(HeadUiStrings.Staff.AvatarAction, () => OnEditAvatarRequested(_viewModel, row)));

        var fingerprintItem = CreateActionItem(
            HeadUiStrings.Staff.DeleteFingerprint,
            () => OnDeleteFingerprintRequested(_viewModel, row));
        fingerprintItem.IsEnabled = row.Registered;
        menu.Items.Add(fingerprintItem);

        menu.PlacementTarget = button;
        menu.IsOpen = true;
    }

    private static MenuItem CreateActionItem(string header, Action action)
    {
        var item = new MenuItem { Header = header };
        item.Click += (_, _) => action();
        return item;
    }
}
