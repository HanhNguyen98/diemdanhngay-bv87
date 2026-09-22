using System.Collections.ObjectModel;
using System.Windows;
using BV87.App.Helpers;
using BV87.App.Shell;
using BV87.App.ViewModels;
using BV87.Core.Constants;

namespace BV87.App.Views.Admin;

public partial class ReminderDialog : AppDialogWindow
{
    public ReminderDialog(IEnumerable<ReminderDeptItem> items, DateOnly attendanceDate)
    {
        InitializeComponent();
        DialogContextHeaderHelper.SetBadge(ContextHeader, AdminUiStrings.ReminderModalBadge);
        ContextHeader.SecondaryText = string.Format(
            AdminUiStrings.ReminderDateHint,
            AdminUtilitiesFormatHelper.FormatDateOnly(attendanceDate));
        DeptList.ItemsSource = new ObservableCollection<ReminderDeptItem>(items);
    }

    public IReadOnlyList<int> SelectedDeptCodes =>
        DeptList.ItemsSource is ObservableCollection<ReminderDeptItem> items
            ? items.Where(i => i.IsSelected && i.HasHead).Select(i => i.DeptCode).ToList()
            : [];

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void Send_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = true;
        Close();
    }
}
