using BV87.App.Helpers;
using BV87.App.Shell;
using BV87.App.ViewModels;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Models.Attendance;

namespace BV87.App.Views.Attendance;

public partial class ManualScheduleDialog : AppDialogWindow
{
    public ManualScheduleDialog(AttendanceApiClient attendanceApi, StaffAttendanceRow staff)
    {
        InitializeComponent();
        Title = AttendanceUiStrings.ManualScheduleTitle;
        DialogContextHeaderHelper.SetPerson(ContextHeader, staff.Fullname, staff.DeptDisplay);
        var viewModel = new ManualScheduleViewModel(attendanceApi, staff);
        viewModel.CloseRequested += (_, _) => Close();
        DataContext = viewModel;
    }
}
