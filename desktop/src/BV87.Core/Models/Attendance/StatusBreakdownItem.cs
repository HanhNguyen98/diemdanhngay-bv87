namespace BV87.Core.Models.Attendance;

public sealed class StatusBreakdownItem
{
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? BadgeLabel { get; set; }
    public string? ColorKey { get; set; }
    public long Count { get; set; }
    public List<StatusBreakdownItem> Children { get; set; } = [];
}
