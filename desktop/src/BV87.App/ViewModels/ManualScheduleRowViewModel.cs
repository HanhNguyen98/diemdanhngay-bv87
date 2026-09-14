using BV87.Core.Helpers;
using BV87.Core.Models.Attendance;

namespace BV87.App.ViewModels;

public sealed class ManualScheduleRowViewModel : IPageRowNumber
{
    public ManualScheduleRowViewModel(ManualSchedulePeriodDto dto)
    {
        FromText = dto.FromDate.ToString("dd/MM/yyyy");
        ToText = dto.ToDate.ToString("dd/MM/yyyy");
        DayCount = dto.DayCount.ToString();
        StatusCode = dto.Status ?? string.Empty;
        StatusText = string.IsNullOrWhiteSpace(dto.StatusLabel) ? dto.Status ?? "—" : dto.StatusLabel;
    }

    public int RowNumber { get; set; }
    public string FromText { get; }
    public string ToText { get; }
    public string DayCount { get; }
    public string StatusCode { get; }
    public string StatusText { get; }
}

public sealed class ManualScheduleStatusFilterOption(string status, string label)
{
    public string Status { get; } = status;
    public string Label { get; } = label;
}
