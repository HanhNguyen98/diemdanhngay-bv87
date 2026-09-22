using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using BV87.App.Shell;
using BV87.App.Helpers;
using BV87.App.ViewModels;
using BV87.Core.Constants;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.Views.Admin.Catalog;

public partial class AttendanceStatusCatalogFormDialog : AppDialogWindow
{
    private readonly StatusCatalogViewModel _viewModel;
    private readonly StatusCatalogRowViewModel? _initial;
    private readonly bool _isEdit;
    private bool _syncingFields;

    public AttendanceStatusCatalogFormDialog(
        StatusCatalogViewModel viewModel,
        StatusCatalogRowViewModel? initial)
    {
        InitializeComponent();
        _viewModel = viewModel;
        _initial = initial;
        _isEdit = initial != null;

        ApplyLabels();
        BindOptions();

        if (_isEdit && initial != null)
        {
            LoadEditState(initial);
        }
        else
        {
            LoadCreateDefaults();
        }

        UpdateParentPanelVisibility();
        UpdateActiveCheckboxText();
        Loaded += OnLoaded;
    }

    private void UpdateContextHeader()
    {
        if (!_isEdit || _initial == null)
        {
            DialogContextHeaderHelper.SetBadge(ContextHeader, CatalogUiStrings.StatusCatalog.FormHeaderBadgeCreate);
            return;
        }

        DialogContextHeaderHelper.SetPerson(ContextHeader, _initial.Label, _initial.Code);
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        ApplyScreenHeightLimits();
        LabelBox.Focus();
    }

    private void ApplyScreenHeightLimits()
    {
        var maxHeight = SystemParameters.WorkArea.Height * 0.9;
        MaxHeight = maxHeight;
        if (Height > maxHeight)
        {
            Height = maxHeight;
        }
    }

    private void ApplyLabels()
    {
        Title = _isEdit
            ? CatalogUiStrings.StatusCatalog.FormTitleEdit
            : CatalogUiStrings.StatusCatalog.FormTitleCreate;
        UpdateContextHeader();
        CodeLabel.Text = CatalogUiStrings.StatusCatalog.FormCode;
        LabelFieldLabel.Text = CatalogUiStrings.StatusCatalog.FormLabel;
        BadgeLabelFieldLabel.Text = CatalogUiStrings.StatusCatalog.FormBadgeLabel;
        ColorLabel.Text = CatalogUiStrings.StatusCatalog.FormColor;
        IconLabel.Text = CatalogUiStrings.StatusCatalog.FormIcon;
        SortOrderLabel.Text = CatalogUiStrings.StatusCatalog.FormSortOrder;
        ManualAllowedLabel.Text = CatalogUiStrings.StatusCatalog.FormManualAllowed;
        ManualAllowedBox.Content = CatalogUiStrings.StatusCatalog.FormManualAllowedHint;
        GroupParentLabel.Text = CatalogUiStrings.StatusCatalog.FormGroupParent;
        GroupParentBox.Content = CatalogUiStrings.StatusCatalog.FormGroupParentHint;
        ParentCodeLabel.Text = CatalogUiStrings.StatusCatalog.FormParentCode;
        ActiveLabel.Text = CatalogUiStrings.StatusCatalog.FormActive;
        CancelButton.Content = CatalogUiStrings.Cancel;
        SaveButton.Content = CatalogUiStrings.Save;
    }

    private void BindOptions()
    {
        ColorCombo.ItemsSource = StatusCatalogOptions.ColorOptions;
        IconCombo.ItemsSource = StatusCatalogOptions.IconOptions;
        ParentCombo.ItemsSource = _viewModel.GetParentComboOptions(_initial?.Code);
    }

    private void LoadEditState(StatusCatalogRowViewModel initial)
    {
        CodeBox.Text = initial.Code;
        CodeBox.IsReadOnly = true;
        CodeBox.Background = (System.Windows.Media.Brush)FindResource("PrimaryLightBrush");
        LabelBox.Text = initial.Label;
        BadgeLabelBox.Text = initial.BadgeLabel;
        SelectCombo(ColorCombo, initial.ColorKey);
        SelectCombo(IconCombo, initial.IconKey);
        SortOrderBox.Text = initial.SortOrder.ToString(CultureInfo.InvariantCulture);
        ManualAllowedBox.IsChecked = initial.ManualAllowed;
        GroupParentBox.IsChecked = initial.GroupParent;
        ActiveBox.IsChecked = initial.Active;
        SelectParent(initial.ParentCode);
    }

    private void LoadCreateDefaults()
    {
        SelectCombo(ColorCombo, "green");
        SelectCombo(IconCombo, "check");
        SortOrderBox.Text = "0";
        ActiveBox.IsChecked = true;
    }

    private static void SelectCombo(ComboBox combo, string? value)
    {
        foreach (StatusCatalogOptions.Option item in combo.Items)
        {
            if (string.Equals(item.Value, value, StringComparison.OrdinalIgnoreCase))
            {
                combo.SelectedItem = item;
                return;
            }
        }

        if (combo.Items.Count > 0)
        {
            combo.SelectedIndex = 0;
        }
    }

    private void SelectParent(string? parentCode)
    {
        if (string.IsNullOrWhiteSpace(parentCode))
        {
            ParentCombo.SelectedItem = StatusCatalogParentOption.Placeholder;
            return;
        }

        foreach (StatusCatalogParentOption item in ParentCombo.Items)
        {
            if (string.Equals(item.Code, parentCode, StringComparison.OrdinalIgnoreCase))
            {
                ParentCombo.SelectedItem = item;
                return;
            }
        }

        ParentCombo.SelectedItem = StatusCatalogParentOption.Placeholder;
    }

    private void LabelBox_TextChanged(object sender, TextChangedEventArgs e)
    {
        if (_syncingFields)
        {
            return;
        }

        var label = LabelBox.Text;
        if (!_isEdit && string.IsNullOrWhiteSpace(CodeBox.Text))
        {
            SetFieldText(CodeBox, StatusCatalogCodeHelper.SlugifyCode(label));
        }

        if (string.IsNullOrWhiteSpace(BadgeLabelBox.Text))
        {
            SetFieldText(BadgeLabelBox, label.Trim().ToUpperInvariant());
        }
    }

    private void CodeBox_TextChanged(object sender, TextChangedEventArgs e)
    {
        if (_syncingFields || _isEdit)
        {
            return;
        }

        var upper = CodeBox.Text.ToUpperInvariant();
        if (!string.Equals(CodeBox.Text, upper, StringComparison.Ordinal))
        {
            var caret = CodeBox.CaretIndex;
            SetFieldText(CodeBox, upper);
            CodeBox.CaretIndex = Math.Min(caret, CodeBox.Text.Length);
        }
    }

    private void SetFieldText(TextBox box, string value)
    {
        _syncingFields = true;
        box.Text = value;
        _syncingFields = false;
    }

    private void GroupParentBox_Changed(object sender, RoutedEventArgs e) => UpdateParentPanelVisibility();

    private void ActiveBox_Changed(object sender, RoutedEventArgs e) => UpdateActiveCheckboxText();

    private void UpdateParentPanelVisibility()
    {
        var isGroupParent = GroupParentBox.IsChecked == true;
        ParentPanel.Visibility = isGroupParent ? Visibility.Collapsed : Visibility.Visible;
        if (isGroupParent)
        {
            ParentCombo.SelectedItem = StatusCatalogParentOption.Placeholder;
        }
    }

    private void UpdateActiveCheckboxText()
    {
        ActiveBox.Content = ActiveBox.IsChecked == true
            ? CatalogUiStrings.Active
            : CatalogUiStrings.Inactive;
    }

    private async void Save_Click(object sender, RoutedEventArgs e)
    {
        HideError();

        var code = CodeBox.Text.Trim().ToUpperInvariant();
        var label = LabelBox.Text.Trim();
        var badgeLabel = BadgeLabelBox.Text.Trim();

        if (string.IsNullOrWhiteSpace(label))
        {
            ShowError(CatalogUiStrings.StatusCatalog.LabelRequired);
            return;
        }

        if (string.IsNullOrWhiteSpace(code))
        {
            ShowError(CatalogUiStrings.StatusCatalog.CodeRequired);
            return;
        }

        if (string.IsNullOrWhiteSpace(badgeLabel))
        {
            ShowError(CatalogUiStrings.StatusCatalog.BadgeRequired);
            return;
        }

        var sortOrder = ParseSortOrder(SortOrderBox.Text);
        if (sortOrder == null)
        {
            ShowError(CatalogUiStrings.StatusCatalog.SortOrderInvalid);
            return;
        }

        if (ColorCombo.SelectedItem is not StatusCatalogOptions.Option colorOption
            || IconCombo.SelectedItem is not StatusCatalogOptions.Option iconOption)
        {
            ShowError(CatalogUiStrings.StatusCatalog.ColorIconRequired);
            return;
        }

        var groupParent = GroupParentBox.IsChecked == true;
        string? parentCode = null;
        if (!groupParent
            && ParentCombo.SelectedItem is StatusCatalogParentOption parentOption
            && !parentOption.IsPlaceholder)
        {
            parentCode = parentOption.Code;
        }

        var request = new AttendanceStatusTypeUpsertRequest
        {
            Code = code,
            Label = label,
            BadgeLabel = badgeLabel,
            ColorKey = colorOption.Value,
            IconKey = iconOption.Value,
            SortOrder = sortOrder.Value,
            Active = ActiveBox.IsChecked != false,
            ManualAllowed = ManualAllowedBox.IsChecked == true,
            GroupParent = groupParent,
            ParentCode = parentCode ?? string.Empty
        };

        SaveButton.IsEnabled = false;

        try
        {
            await _viewModel.SaveItemAsync(request, _isEdit ? _initial?.Id : null);
            DialogResult = true;
            Close();
        }
        catch
        {
            SaveButton.IsEnabled = true;
            ShowError(_viewModel.ErrorMessage ?? CatalogUiStrings.StatusCatalog.FormSaveFail);
        }
    }

    private static int? ParseSortOrder(string? raw)
    {
        var text = (raw ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(text))
        {
            return 0;
        }

        return int.TryParse(text, out var value) && value >= 0 ? value : null;
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
