namespace BV87.Core.Models.Attendance;

public sealed class QuickActionItem
{
    public required string Code { get; init; }
    public required string Label { get; init; }
    public required string ShortLabel { get; init; }
    public string? ColorKey { get; init; }
    public bool IsPostScanOverride { get; init; }
}
