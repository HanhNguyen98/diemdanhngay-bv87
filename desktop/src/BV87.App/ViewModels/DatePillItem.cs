namespace BV87.App.ViewModels;

public sealed class DatePillItem
{
    public required DateOnly Date { get; init; }
    public required string Label { get; init; }
    public bool IsSelected { get; init; }
}
