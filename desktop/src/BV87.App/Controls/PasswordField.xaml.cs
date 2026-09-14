using System.Windows;
using System.Windows.Controls;
using BV87.Core.Constants;

namespace BV87.App.Controls;

/// <summary>Password input with reveal toggle — fixed height, no horizontal grow on long text.</summary>
public partial class PasswordField : UserControl
{
    private const string ViewIcon = "\uE890";
    private const string HideIcon = "\uE7B8";

    private bool _syncing;

    public static readonly DependencyProperty PasswordProperty =
        DependencyProperty.Register(
            nameof(Password),
            typeof(string),
            typeof(PasswordField),
            new FrameworkPropertyMetadata(
                string.Empty,
                FrameworkPropertyMetadataOptions.BindsTwoWayByDefault,
                OnPasswordPropertyChanged));

    public static readonly DependencyProperty IsRevealedProperty =
        DependencyProperty.Register(
            nameof(IsRevealed),
            typeof(bool),
            typeof(PasswordField),
            new PropertyMetadata(false, OnIsRevealedChanged));

    public PasswordField()
    {
        InitializeComponent();
        UpdateToggleUi();
    }

    public string Password
    {
        get => (string)GetValue(PasswordProperty);
        set => SetValue(PasswordProperty, value);
    }

    public bool IsRevealed
    {
        get => (bool)GetValue(IsRevealedProperty);
        set => SetValue(IsRevealedProperty, value);
    }

    public void Clear()
    {
        Password = string.Empty;
    }

    private static void OnPasswordPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is PasswordField field)
        {
            field.ApplyPasswordToInputs(e.NewValue as string ?? string.Empty);
        }
    }

    private static void OnIsRevealedChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is PasswordField field)
        {
            field.UpdateToggleUi();
        }
    }

    private void ApplyPasswordToInputs(string value)
    {
        if (_syncing)
        {
            return;
        }

        _syncing = true;
        try
        {
            if (HiddenBox.Password != value)
            {
                HiddenBox.Password = value;
            }

            if (VisibleBox.Text != value)
            {
                VisibleBox.Text = value;
            }
        }
        finally
        {
            _syncing = false;
        }
    }

    private void HiddenBox_PasswordChanged(object sender, RoutedEventArgs e)
    {
        if (_syncing)
        {
            return;
        }

        _syncing = true;
        try
        {
            Password = HiddenBox.Password;
            VisibleBox.Text = HiddenBox.Password;
        }
        finally
        {
            _syncing = false;
        }
    }

    private void VisibleBox_TextChanged(object sender, TextChangedEventArgs e)
    {
        if (_syncing || !IsRevealed)
        {
            return;
        }

        _syncing = true;
        try
        {
            Password = VisibleBox.Text;
            HiddenBox.Password = VisibleBox.Text;
        }
        finally
        {
            _syncing = false;
        }
    }

    private void ToggleButton_Click(object sender, RoutedEventArgs e)
    {
        IsRevealed = !IsRevealed;
        ApplyPasswordToInputs(Password);

        if (IsRevealed)
        {
            VisibleBox.Focus();
            VisibleBox.CaretIndex = VisibleBox.Text.Length;
        }
        else
        {
            HiddenBox.Focus();
        }
    }

    private void UpdateToggleUi()
    {
        ToggleIcon.Text = IsRevealed ? HideIcon : ViewIcon;
        ToggleButton.ToolTip = IsRevealed
            ? SettingsUiStrings.HidePasswordTooltip
            : SettingsUiStrings.ShowPasswordTooltip;
    }
}
