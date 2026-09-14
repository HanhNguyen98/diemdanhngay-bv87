using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels;

/// <summary>Wraps a department progress row with a page-local ordinal (STT).</summary>
public sealed class DeptProgressRowViewModel
{
    public int RowNumber { get; init; }

    public DeptProgressSummary Dept { get; init; } = null!;
}
