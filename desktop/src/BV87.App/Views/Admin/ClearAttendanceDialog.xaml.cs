using System.Windows;
using BV87.App.Shell;
using BV87.Core.Constants;
using BV87.Core.Models.Attendance;

namespace BV87.App.Views.Admin;

public partial class ClearAttendanceDialog : AppDialogWindow
{
    public ClearAttendanceRequest? Result { get; private set; }

    public ClearAttendanceDialog(StaffAttendanceRow staff, DateOnly date, bool reportSubmitted)
    {
        InitializeComponent();

        TitleText.Text = AdminUiStrings.ClearAttendanceTitle;
        SubtitleText.Text = $"{staff.EmpCodeFormatted ?? staff.EmpCode.ToString()} - {staff.Fullname}";
        HintText.Text = AdminUiStrings.ClearAttendanceHint;
        ReportWarningText.Text = AdminUiStrings.ClearAttendanceAfterSubmitWarn;
        ReportWarningPanel.Visibility = reportSubmitted ? Visibility.Visible : Visibility.Collapsed;
        ReasonLabelText.Text = AdminUiStrings.ClearAttendanceReason;
        ReasonBox.ToolTip = AdminUiStrings.ClearAttendanceReasonPlaceholder;

        Tag = staff.EmpCode;
        DateTag = date;
    }

    private DateOnly DateTag { get; }

    private void CancelButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void ConfirmButton_Click(object sender, RoutedEventArgs e)
    {
        ErrorText.Visibility = Visibility.Collapsed;
        var reason = ReasonBox.Text.Trim();
        if (string.IsNullOrWhiteSpace(reason))
        {
            ErrorText.Text = AdminUiStrings.ClearAttendanceNeedReason;
            ErrorText.Visibility = Visibility.Visible;
            return;
        }

        Result = new ClearAttendanceRequest
        {
            EmpCode = (int)Tag!,
            Date = DateTag,
            Reason = reason
        };
        DialogResult = true;
        Close();
    }
}
