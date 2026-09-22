using System.Windows;
using BV87.App.Shell;
using BV87.App.Helpers;
using BV87.Core.Constants;
using BV87.Core.Models.Attendance;

namespace BV87.App.Views.Head;

public partial class ManualRangeDialog : AppDialogWindow
{
    public ManualRangeDialog(
        StaffAttendanceRow staff,
        QuickActionItem action,
        DateOnly defaultDate,
        bool requireExplainNote = false)
    {
        InitializeComponent();
        Title = action.Label;
        DialogContextHeaderHelper.SetPerson(ContextHeader, staff.Fullname, staff.DeptDisplay);
        FromDatePicker.SelectedDate = defaultDate.ToDateTime(TimeOnly.MinValue);
        ToDatePicker.SelectedDate = defaultDate.ToDateTime(TimeOnly.MinValue);
        Staff = staff;
        Action = action;
        RequireExplainNote = requireExplainNote;
        NoteLabel.Text = requireExplainNote
            ? AttendanceUiStrings.ManualRangeNoteRequired
            : AttendanceUiStrings.ManualRangeNoteOptional;
    }

    private StaffAttendanceRow Staff { get; }
    private QuickActionItem Action { get; }
    private bool RequireExplainNote { get; }

    public string ActionLabel => Action.Label;

    public ManualAttendanceRangeRequest? Result { get; private set; }

    private void CancelButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void ConfirmButton_Click(object sender, RoutedEventArgs e)
    {
        if (FromDatePicker.SelectedDate == null || ToDatePicker.SelectedDate == null)
        {
            AppMessageBox.Show(this, "Vui lòng chọn từ ngày và đến ngày.", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var from = DateOnly.FromDateTime(FromDatePicker.SelectedDate.Value);
        var to = DateOnly.FromDateTime(ToDatePicker.SelectedDate.Value);
        if (to < from)
        {
            AppMessageBox.Show(this, "Đến ngày không được trước từ ngày.", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (RequireExplainNote && string.IsNullOrWhiteSpace(NoteBox.Text))
        {
            AppMessageBox.Show(
                this,
                AttendanceUiStrings.IncompleteExplainNeedReason,
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        Result = new ManualAttendanceRangeRequest
        {
            EmpCode = Staff.EmpCode,
            Status = Action.Code,
            FromDate = from,
            ToDate = to,
            Note = string.IsNullOrWhiteSpace(NoteBox.Text) ? null : NoteBox.Text.Trim()
        };
        DialogResult = true;
        Close();
    }
}
