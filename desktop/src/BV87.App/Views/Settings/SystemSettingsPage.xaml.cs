using System.Windows;
using System.Windows.Controls;
using BV87.App.ViewModels.Settings;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using Microsoft.Win32;

namespace BV87.App.Views.Settings;

public partial class SystemSettingsPage : UserControl
{
    private SystemSettingsViewModel? _viewModel;

    public SystemSettingsPage()
    {
        InitializeComponent();
        Loaded += OnLoaded;
        Unloaded += OnUnloaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        if (DataContext is SystemSettingsViewModel existing)
        {
            AttachViewModel(existing);
            return;
        }

        var viewModel = new SystemSettingsViewModel(App.AdminApi);
        AttachViewModel(viewModel);
        DataContext = viewModel;
    }

    private void OnUnloaded(object sender, RoutedEventArgs e)
    {
        if (_viewModel != null)
        {
            _viewModel.PickImageRequested -= OnPickImageRequested;
        }
    }

    private void AttachViewModel(SystemSettingsViewModel viewModel)
    {
        if (ReferenceEquals(_viewModel, viewModel))
        {
            return;
        }

        if (_viewModel != null)
        {
            _viewModel.PickImageRequested -= OnPickImageRequested;
        }

        _viewModel = viewModel;
        _viewModel.PickImageRequested += OnPickImageRequested;
    }

    private async void OnPickImageRequested(object? sender, bool isLogo)
    {
        if (_viewModel == null)
        {
            return;
        }

        var dialog = new OpenFileDialog
        {
            Title = isLogo
                ? SettingsUiStrings.System.LogoPick
                : SettingsUiStrings.System.LoginAvatarPick,
            Filter = "Ảnh JPG/PNG/GIF/WEBP|*.jpg;*.jpeg;*.png;*.gif;*.webp;*.JPG;*.JPEG;*.PNG;*.GIF;*.WEBP",
            Multiselect = false,
            CheckFileExists = true
        };

        var owner = Window.GetWindow(this);
        var confirmed = owner != null ? dialog.ShowDialog(owner) : dialog.ShowDialog();
        if (confirmed != true)
        {
            return;
        }

        try
        {
            var dataUrl = await ImageDataUrlHelper.ReadAsDataUrlAsync(dialog.FileName);
            _viewModel.ApplyPickedImage(isLogo, dataUrl);
        }
        catch (Exception ex)
        {
            _viewModel.SetImageError(isLogo, ex.Message);
        }
    }
}
