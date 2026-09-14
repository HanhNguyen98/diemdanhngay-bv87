namespace BV87.App.Shell;

public sealed class ShellNavGroup
{
    public string? Title { get; init; }
    public IReadOnlyList<ShellNavItem> Items { get; init; } = [];
}
