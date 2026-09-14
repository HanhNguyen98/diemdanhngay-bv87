using BV87.App.Controls;
using BV87.App.Helpers;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels.Utilities;

public sealed class UnlockRequestRowViewModel : IPageRowNumber
{
    public UnlockRequestRowViewModel(UnlockRequestItemDto dto)
    {
        Id = dto.Id;
        AttendanceDateText = AdminUtilitiesFormatHelper.FormatDateOnly(dto.AttendanceDate);
        DeptLabel = DeptDisplayFormatter.Format(dto.UnitCode, dto.DeptName);
        RequestedBy = string.IsNullOrWhiteSpace(dto.RequestedBy) ? "—" : dto.RequestedBy!;
        Reason = string.IsNullOrWhiteSpace(dto.Reason) ? "—" : dto.Reason!;
        Status = dto.Status ?? string.Empty;
        StatusLabel = dto.StatusLabel ?? dto.Status ?? "—";
        RequestedAtText = AdminUtilitiesFormatHelper.FormatLogDateTimeOrDash(dto.RequestedAt);
        IsPending = string.Equals(dto.Status, "PENDING", StringComparison.OrdinalIgnoreCase);
        StatusBadgeKind = Status switch
        {
            "APPROVED" => StatusBadgeKind.Success,
            "REJECTED" => StatusBadgeKind.Danger,
            "PENDING" => StatusBadgeKind.Warning,
            _ => StatusBadgeKind.Neutral
        };
    }

    public long Id { get; }
    public int RowNumber { get; set; }
    public string AttendanceDateText { get; }
    public string DeptLabel { get; }
    public string RequestedBy { get; }
    public string Reason { get; }
    public string Status { get; }
    public string StatusLabel { get; }
    public string RequestedAtText { get; }
    public bool IsPending { get; }
    public StatusBadgeKind StatusBadgeKind { get; }
}

public sealed class UnlockStatusFilterOption(string status, string label)
{
    public string Status { get; } = status;
    public string Label { get; } = label;
}
