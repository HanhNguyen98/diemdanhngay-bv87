using BV87.Core.Helpers;
using BV87.Core.Models.Attendance;

namespace BV87.App.ViewModels;

public sealed class AttendanceHistoryRowViewModel : IPageRowNumber
{
    public AttendanceHistoryRowViewModel(AttendanceHistoryItem item)
    {
        DateText = item.AttendanceDateFormatted
            ?? item.AttendanceDate?.ToString("dd/MM/yyyy")
            ?? "—";
        Fullname = item.Fullname;
        EmpCodeFormatted = item.EmpCodeFormatted ?? item.EmpCode.ToString("D5");
        StatusLabel = item.StatusLabel ?? item.Status ?? "—";
        NoteText = string.IsNullOrWhiteSpace(item.Note) ? "—" : item.Note.Trim();
    }

    public int RowNumber { get; set; }
    public string DateText { get; }
    public string Fullname { get; }
    public string EmpCodeFormatted { get; }
    public string StatusLabel { get; }
    public string NoteText { get; }
}
