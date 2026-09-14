using BV87.App.Controls;
using BV87.App.Helpers;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels.Utilities;

public sealed class ReminderHistoryRowViewModel : IPageRowNumber
{
    public ReminderHistoryRowViewModel(ReminderHistoryItemDto dto)
    {
        AttendanceDateText = AdminUtilitiesFormatHelper.FormatDateOnly(dto.AttendanceDate);
        DeptName = DeptDisplayFormatter.Format(dto.UnitCode, dto.DeptName);
        TriggerLabel = string.Equals(dto.TriggerType, "AUTO", StringComparison.OrdinalIgnoreCase)
            ? BV87.Core.Constants.UtilitiesUiStrings.ReminderHistory.TriggerAuto
            : BV87.Core.Constants.UtilitiesUiStrings.ReminderHistory.TriggerManual;
        TriggerBadgeKind = string.Equals(dto.TriggerType, "AUTO", StringComparison.OrdinalIgnoreCase)
            ? StatusBadgeKind.Info
            : StatusBadgeKind.Neutral;
        SentAtText = AdminUtilitiesFormatHelper.FormatLogDateTimeOrDash(dto.CreatedAt);
        DeptCode = dto.DeptCode;
    }

    public string AttendanceDateText { get; }
    public int RowNumber { get; set; }
    public string DeptName { get; }
    public string TriggerLabel { get; }
    public StatusBadgeKind TriggerBadgeKind { get; }
    public string SentAtText { get; }
    public int? DeptCode { get; }
}

public sealed class ReminderTriggerFilterOption(string? triggerType, string label)
{
    public string? TriggerType { get; } = triggerType;
    public string Label { get; } = label;
}
