using System.Text.RegularExpressions;
using System.Windows;
using BV87.App.Helpers;
using BV87.App.Shell;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Attendance;

namespace BV87.App.Views.Admin;

public partial class FillAttendanceTimesDialog : AppDialogWindow
{
    private static readonly Regex TimePattern = new(@"^\d{2}:\d{2}$", RegexOptions.Compiled);

    public FillAttendanceTimesRequest? Result { get; private set; }

    public FillAttendanceTimesDialog(StaffAttendanceRow staff, DateOnly date)
    {
        InitializeComponent();

        Title = AdminUiStrings.FillTimesTitle;
        DialogContextHeaderHelper.SetPerson(
            ContextHeader,
            staff.Fullname,
            $"{staff.DeptDisplay} · {AdminUtilitiesFormatHelper.FormatDateOnly(date)}");
        HintText.Text = AdminUiStrings.FillTimesHint;
        IntentLabelText.Text = AdminUiStrings.FillTimesHeadReasonIntent;
        IntentValueText.Text = staff.PayrollIntentLabel ?? "—";
        ReasonLabelText.Text = AdminUiStrings.FillTimesHeadReasonText;
        ReasonValueText.Text = staff.MissingPunchReason ?? "—";

        ConfigureSlot(MorningPanel, MorningLabel, MorningBox, AdminUiStrings.FillTimesLabelMorningIn,
            staff.MorningInAt ?? staff.CheckInAt);
        ConfigureSlot(NoonPanel, NoonLabel, NoonBox, AdminUiStrings.FillTimesLabelNoonOut, staff.NoonOutAt);
        ConfigureSlot(AfternoonInPanel, AfternoonInLabel, AfternoonInBox, AdminUiStrings.FillTimesLabelAfternoonIn,
            staff.AfternoonInAt);
        ConfigureSlot(AfternoonOutPanel, AfternoonOutLabel, AfternoonOutBox, AdminUiStrings.FillTimesLabelAfternoonOut,
            staff.AfternoonOutAt ?? (staff.NoonOutAt == null ? staff.CheckOutAt : null));

        Tag = staff.EmpCode;
        DateTag = date;
    }

    private DateOnly DateTag { get; }

    private void ConfigureSlot(
        FrameworkElement panel,
        System.Windows.Controls.TextBlock label,
        System.Windows.Controls.TextBox box,
        string labelText,
        DateTimeOffset? existing)
    {
        label.Text = labelText;
        if (existing != null)
        {
            panel.Visibility = Visibility.Collapsed;
            box.Text = AttendanceFormatHelper.FormatInstant(existing);
        }
    }

    private void CancelButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void SaveButton_Click(object sender, RoutedEventArgs e)
    {
        ErrorText.Visibility = Visibility.Collapsed;

        try
        {
            var request = new FillAttendanceTimesRequest
            {
                EmpCode = (int)Tag!,
                Date = DateTag
            };

            if (MorningPanel.Visibility == Visibility.Visible && TryReadTime(MorningBox, out var morning))
            {
                request.MorningInTime = morning;
            }

            if (NoonPanel.Visibility == Visibility.Visible && TryReadTime(NoonBox, out var noon))
            {
                request.NoonOutTime = noon;
            }

            if (AfternoonInPanel.Visibility == Visibility.Visible && TryReadTime(AfternoonInBox, out var afternoonIn))
            {
                request.AfternoonInTime = afternoonIn;
            }

            if (AfternoonOutPanel.Visibility == Visibility.Visible && TryReadTime(AfternoonOutBox, out var afternoonOut))
            {
                request.AfternoonOutTime = afternoonOut;
            }

            if (request.MorningInTime == null && request.NoonOutTime == null
                && request.AfternoonInTime == null && request.AfternoonOutTime == null)
            {
                ErrorText.Text = AdminUiStrings.FillTimesNeedOne;
                ErrorText.Visibility = Visibility.Visible;
                return;
            }

            Result = request;
            DialogResult = true;
            Close();
        }
        catch (InvalidOperationException ex)
        {
            ErrorText.Text = ex.Message;
            ErrorText.Visibility = Visibility.Visible;
        }
    }

    private static bool TryReadTime(System.Windows.Controls.TextBox box, out string? value)
    {
        value = null;
        var raw = box.Text.Trim();
        if (string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        if (!TimePattern.IsMatch(raw))
        {
            throw new InvalidOperationException("Định dạng giờ phải là HH:mm.");
        }

        value = raw;
        return true;
    }
}
