using BV87.App.Shell;
using BV87.App.ViewModels;
using BV87.Core.Api;
using BV87.Core.Models.Attendance;

namespace BV87.App.Views.Attendance;

public partial class ManualScheduleDialog : AppDialogWindow
{
    public ManualScheduleDialog(AttendanceApiClient attendanceApi, StaffAttendanceRow staff)
    {
        InitializeComponent();
        var viewModel = new ManualScheduleViewModel(attendanceApi, staff);
        viewModel.CloseRequested += (_, _) => Close();
        DataContext = viewModel;
    }
}
