using System.Windows;
using System.Windows.Controls;
using BV87.App.ViewModels;

namespace BV87.App.Views.Head;

public partial class HeadAttendancePage : UserControl
{
    private readonly DateOnly? _initialDate;

    public HeadAttendancePage() : this(null)
    {
    }

    public HeadAttendancePage(DateOnly? initialDate)
    {
        _initialDate = initialDate;
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        if (DataContext != null)
        {
            return;
        }

        var user = App.Sessions.Session.User;
        if (user?.DeptCode == null)
        {
            Content = new PlaceholderPage(
                "Chấm công",
                "Tài khoản không gắn đơn vị. Chỉ tài khoản Trưởng đơn vị mới sử dụng màn Chấm công.");
            return;
        }

        var vm = new HeadAttendanceViewModel(App.AttendanceApi, user.DeptCode.Value, user.DeptName);
        DataContext = vm;

        if (_initialDate != null && vm.SelectDateCommand.CanExecute(_initialDate))
        {
            vm.SelectDateCommand.Execute(_initialDate);
        }
    }

    private void DatePill_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button { Tag: DatePillItem pill } || DataContext is not HeadAttendanceViewModel vm)
        {
            return;
        }

        if (vm.SelectDateCommand.CanExecute(pill.Date))
        {
            vm.SelectDateCommand.Execute(pill.Date);
        }
    }
}
