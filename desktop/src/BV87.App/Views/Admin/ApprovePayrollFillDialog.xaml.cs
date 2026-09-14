using System.Windows;
using BV87.App.Shell;
using BV87.Core.Constants;
using BV87.Core.Models.Attendance;

namespace BV87.App.Views.Admin;

public partial class ApprovePayrollFillDialog : AppDialogWindow
{
    public PayrollFillApproveRequest? Result { get; private set; }

    public ApprovePayrollFillDialog(StaffAttendanceRow staff, DateOnly date)
    {
        InitializeComponent();

        TitleText.Text = AdminUiStrings.PayrollFillApproveTitle;
        SubtitleText.Text = $"{staff.Fullname} · {staff.EmpCodeFormatted ?? staff.EmpCode.ToString()}";
        HintText.Text = AdminUiStrings.PayrollFillApproveHint;
        IntentValueText.Text = staff.PayrollIntentLabel ?? "—";
        ReasonValueText.Text = staff.MissingPunchReason ?? "—";

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
        Result = new PayrollFillApproveRequest
        {
            EmpCode = (int)Tag!,
            Date = DateTag
        };
        DialogResult = true;
        Close();
    }
}
