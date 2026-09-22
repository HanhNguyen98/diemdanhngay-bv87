using System.Globalization;
using System.Windows;
using BV87.App.Helpers;
using BV87.App.Shell;
using BV87.App.ViewModels;
using BV87.Core.Api;
using BV87.Core.Constants;

namespace BV87.App.Views.Admin.Catalog;

public partial class StaffAttributeCatalogFormDialog : AppDialogWindow
{
    private readonly StaffAttributeCatalogViewModel _viewModel;
    private readonly StaffAttributeCatalogRowViewModel? _initial;
    private readonly bool _isEdit;

    public StaffAttributeCatalogKind Kind { get; }

    public StaffAttributeCatalogFormDialog(
        StaffAttributeCatalogViewModel viewModel,
        StaffAttributeCatalogKind kind,
        StaffAttributeCatalogRowViewModel? initial)
    {
        Kind = kind;
        InitializeComponent();
        DataContext = this;
        _viewModel = viewModel;
        _initial = initial;
        _isEdit = initial != null;

        var isRank = kind == StaffAttributeCatalogKind.Rank;

        Title = isRank
            ? (_isEdit ? CatalogUiStrings.Ranks.FormTitleEdit : CatalogUiStrings.Ranks.FormTitleCreate)
            : (_isEdit ? CatalogUiStrings.Positions.FormTitleEdit : CatalogUiStrings.Positions.FormTitleCreate);

        UpdateContextHeader(isRank);
        FormCodeLabel = isRank ? CatalogUiStrings.Ranks.FormCode : CatalogUiStrings.Positions.FormCode;
        FormNameLabel = isRank ? CatalogUiStrings.Ranks.FormName : CatalogUiStrings.Positions.FormName;
        FormSortLabel = isRank ? CatalogUiStrings.Ranks.FormSortOrder : CatalogUiStrings.Positions.FormSortOrder;
        ActiveLabel = CatalogUiStrings.Active;

        if (_isEdit && initial != null)
        {
            CodeBox.Text = initial.CodeFormatted;
            NameBox.Text = initial.Name;
            SortOrderBox.Text = initial.SortOrder.ToString(CultureInfo.InvariantCulture);
            ActiveBox.IsChecked = initial.Active;
        }
        else
        {
            CodeBox.Text = CatalogUiStrings.LoadingCode;
            _ = LoadNextCodeAsync(isRank);
        }

        Loaded += (_, _) => NameBox.Focus();
    }

    public string FormCodeLabel { get; }
    public string FormNameLabel { get; }
    public string FormSortLabel { get; }
    public string ActiveLabel { get; }

    private void UpdateContextHeader(bool isRank)
    {
        if (!_isEdit || _initial == null)
        {
            DialogContextHeaderHelper.SetBadge(
                ContextHeader,
                isRank
                    ? CatalogUiStrings.Ranks.FormHeaderBadgeCreate
                    : CatalogUiStrings.Positions.FormHeaderBadgeCreate);
            return;
        }

        DialogContextHeaderHelper.SetPerson(ContextHeader, _initial.Name, _initial.CodeFormatted);
    }

    private async Task LoadNextCodeAsync(bool isRank)
    {
        try
        {
            var next = isRank
                ? await App.AdminApi.GetNextStaffRankCodeAsync()
                : await App.AdminApi.GetNextStaffPositionCodeAsync();
            CodeBox.Text = next.CodeFormatted ?? next.Code.ToString();
        }
        catch (Exception ex)
        {
            CodeBox.Text = "—";
            ShowError(ex.Message.Trim('"', ' '));
        }
    }

    private async void Save_Click(object sender, RoutedEventArgs e)
    {
        HideError();

        var name = NameBox.Text.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            ShowError(_viewModel.UnitLabel == CatalogUiStrings.Ranks.UnitLabel
                ? CatalogUiStrings.Ranks.NameRequired
                : CatalogUiStrings.Positions.NameRequired);
            return;
        }

        int? sortOrder = null;
        if (!string.IsNullOrWhiteSpace(SortOrderBox.Text))
        {
            if (!int.TryParse(SortOrderBox.Text.Trim(), out var parsed) || parsed < 0)
            {
                ShowError("Thứ tự sắp xếp phải là số không âm");
                return;
            }

            sortOrder = parsed;
        }

        var active = ActiveBox.IsChecked != false;
        SaveButton.IsEnabled = false;

        try
        {
            await _viewModel.SaveItemAsync(name, sortOrder, active, _isEdit ? _initial?.Code : null);
            DialogResult = true;
            Close();
        }
        catch
        {
            SaveButton.IsEnabled = true;
        }
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void ShowError(string message)
    {
        ErrorText.Text = message;
        ErrorText.Visibility = Visibility.Visible;
    }

    private void HideError()
    {
        ErrorText.Visibility = Visibility.Collapsed;
    }
}
