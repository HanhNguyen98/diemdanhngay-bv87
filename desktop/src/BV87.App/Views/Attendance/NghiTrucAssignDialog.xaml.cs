using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using BV87.App.Helpers;
using BV87.App.Shell;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Attendance;

namespace BV87.App.Views.Attendance;

public partial class NghiTrucAssignDialog : AppDialogWindow
{
    private readonly StaffAttendanceRow _staff;
    private readonly bool _hasPunches;
    private string _payrollIntent = PayrollIntentCodes.NghiTrucFull;

    public NghiTrucAssignDialog(StaffAttendanceRow staff, DateOnly defaultDate)
    {
        InitializeComponent();
        _staff = staff;
        _hasPunches = AttendanceActionHelper.HasPunchTimes(staff);
        MaxHeight = SystemParameters.WorkArea.Height * 0.9;

        DialogContextHeaderHelper.SetPerson(ContextHeader, staff.Fullname, staff.DeptDisplay);
        HintText.Text = AttendanceActionHelper.IsNghiTrucStatus(staff.Status)
            ? AttendanceUiStrings.NghiTrucWizardReassignHint
            : AttendanceUiStrings.NghiTrucWizardHint;

        PunchLabelText.Text = AttendanceUiStrings.NghiTrucWizardPunchTimesLabel;
        PunchMorningInLabel.Text = AttendanceUiStrings.NghiTrucWizardPunchMorningIn;
        PunchNoonOutLabel.Text = AttendanceUiStrings.NghiTrucWizardPunchNoonOut;
        PunchAfternoonInLabel.Text = AttendanceUiStrings.NghiTrucWizardPunchAfternoonIn;
        PunchAfternoonOutLabel.Text = AttendanceUiStrings.NghiTrucWizardPunchAfternoonOut;
        PunchMorningInValue.Text = AttendanceFormatHelper.FormatClockDisplay(staff.MorningInAt);
        PunchNoonOutValue.Text = AttendanceFormatHelper.FormatClockDisplay(staff.NoonOutAt);
        PunchAfternoonInValue.Text = AttendanceFormatHelper.FormatClockDisplay(staff.AfternoonInAt);
        PunchAfternoonOutValue.Text = AttendanceFormatHelper.FormatClockDisplay(staff.AfternoonOutAt);

        IntentLabelText.Text = AttendanceUiStrings.NghiTrucWizardIntentLabel;
        FullDayTitle.Text = AttendanceUiStrings.NghiTrucIntentFull;
        FullDayCaption.Text = AttendanceUiStrings.NghiTrucIntentFullCaption;
        HalfAfternoonTitle.Text = AttendanceUiStrings.NghiTrucIntentHalfAfternoon;
        HalfAfternoonCaption.Text = AttendanceUiStrings.NghiTrucIntentHalfAfternoonCaption;

        ReasonLabelText.Text = AttendanceUiStrings.NghiTrucWizardReasonLabel;
        ReasonPlaceholder.Text = AttendanceUiStrings.NghiTrucWizardReasonPlaceholder;
        ReasonBox.Text = staff.MissingPunchReason ?? string.Empty;
        ReasonHintText.Text = AttendanceUiStrings.NghiTrucWizardReasonFieldHint;
        FromLabelText.Text = AttendanceUiStrings.ManualRangeFrom;
        ToLabelText.Text = AttendanceUiStrings.ManualRangeTo;
        CancelButton.Content = AttendanceUiStrings.NghiTrucWizardCancel;
        SubmitLabel.Text = AttendanceUiStrings.NghiTrucWizardSubmit;

        var defaultDateTime = defaultDate.ToDateTime(TimeOnly.MinValue);
        FromDatePicker.SelectedDate = defaultDateTime;
        ToDatePicker.SelectedDate = defaultDateTime;
        FromDatePicker.SelectedDateChanged += (_, _) => UpdateSummary();
        ToDatePicker.SelectedDateChanged += (_, _) => UpdateSummary();

        if (_hasPunches)
        {
            FullDayCard.Opacity = 0.45;
            FullDayCard.Cursor = Cursors.Arrow;
            FullDayCard.ToolTip = AttendanceUiStrings.NghiTrucIntentHalfAfternoonCaption;
        }

        _payrollIntent = AttendanceActionHelper.ResolveInitialPayrollIntent(staff, _hasPunches);
        ApplyIntentVisuals();
        UpdateSummary();
        UpdateReasonPlaceholder();
    }

    public NghiTrucAssignRequest? Result { get; private set; }

    private void FullDayCard_Click(object sender, MouseButtonEventArgs e) => TrySelectIntent(PayrollIntentCodes.NghiTrucFull);

    private void HalfAfternoonCard_Click(object sender, MouseButtonEventArgs e) =>
        TrySelectIntent(PayrollIntentCodes.HalfAfternoon);

    private void FullDayCard_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key is Key.Enter or Key.Space)
        {
            TrySelectIntent(PayrollIntentCodes.NghiTrucFull);
            e.Handled = true;
        }
    }

    private void HalfAfternoonCard_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key is Key.Enter or Key.Space)
        {
            TrySelectIntent(PayrollIntentCodes.HalfAfternoon);
            e.Handled = true;
        }
    }

    private void TrySelectIntent(string payrollIntent)
    {
        if (_hasPunches && string.Equals(payrollIntent, PayrollIntentCodes.NghiTrucFull, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        _payrollIntent = payrollIntent;
        ApplyIntentVisuals();
        UpdateSummary();
    }

    private void ApplyIntentVisuals()
    {
        var fullSelected = string.Equals(_payrollIntent, PayrollIntentCodes.NghiTrucFull, StringComparison.OrdinalIgnoreCase);
        SetCardSelected(FullDayCard, FullDayIcon, fullSelected);
        SetCardSelected(HalfAfternoonCard, HalfAfternoonIcon, !fullSelected);
    }

    private void SetCardSelected(System.Windows.Controls.Border card, System.Windows.Controls.TextBlock icon, bool selected)
    {
        if (selected)
        {
            card.BorderBrush = (Brush)FindResource("PrimaryBrush");
            card.Background = (Brush)FindResource("PrimaryLightBrush");
            icon.Foreground = (Brush)FindResource("PrimaryBrush");
            return;
        }

        card.BorderBrush = (Brush)FindResource("LineBrush");
        card.Background = (Brush)FindResource("SurfaceWhiteBrush");
        icon.Foreground = (Brush)FindResource("ContentMutedBrush");
    }

    private void UpdateSummary()
    {
        DateOnly? from = FromDatePicker.SelectedDate != null
            ? DateOnly.FromDateTime(FromDatePicker.SelectedDate.Value)
            : null;
        DateOnly? to = ToDatePicker.SelectedDate != null
            ? DateOnly.FromDateTime(ToDatePicker.SelectedDate.Value)
            : null;

        var intentLabel = AttendanceActionHelper.ResolveNghiTrucIntentLabel(_payrollIntent);
        if (from == null || to == null || to.Value < from.Value)
        {
            DayCountText.Text = string.Empty;
            SummaryText.Text = string.IsNullOrEmpty(intentLabel)
                ? string.Empty
                : $"{_staff.Fullname} · {intentLabel}";
            return;
        }

        DayCountText.Text = AttendanceUiStrings.FormatNghiTrucDayCount(AttendanceActionHelper.DaysInclusive(from.Value, to.Value));
        SummaryText.Text = AttendanceUiStrings.FormatNghiTrucSummary(
            _staff.Fullname,
            intentLabel,
            from.Value.ToString("dd/MM/yyyy"),
            to.Value.ToString("dd/MM/yyyy"));
    }

    private void ReasonBox_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e) =>
        UpdateReasonPlaceholder();

    private void UpdateReasonPlaceholder() =>
        ReasonPlaceholder.Visibility = string.IsNullOrEmpty(ReasonBox.Text)
            ? Visibility.Visible
            : Visibility.Collapsed;

    private void CancelButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void SubmitButton_Click(object sender, RoutedEventArgs e)
    {
        var reason = ReasonBox.Text;
        DateOnly? from = FromDatePicker.SelectedDate != null
            ? DateOnly.FromDateTime(FromDatePicker.SelectedDate.Value)
            : null;
        DateOnly? to = ToDatePicker.SelectedDate != null
            ? DateOnly.FromDateTime(ToDatePicker.SelectedDate.Value)
            : null;

        var validationError = AttendanceActionHelper.ValidateNghiTrucWizardRequest(_payrollIntent, reason, from, to);
        if (validationError != null)
        {
            ErrorText.Text = validationError;
            ErrorBanner.Visibility = Visibility.Visible;
            return;
        }

        Result = new NghiTrucAssignRequest
        {
            EmpCode = _staff.EmpCode,
            FromDate = from!.Value,
            ToDate = to!.Value,
            Reason = reason.Trim(),
            PayrollIntent = _payrollIntent
        };
        DialogResult = true;
        Close();
    }
}
