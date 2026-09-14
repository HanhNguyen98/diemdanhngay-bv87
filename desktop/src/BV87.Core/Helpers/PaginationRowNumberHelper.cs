namespace BV87.Core.Helpers;

/// <summary>Assigns page-local STT values to grid row view models.</summary>
public static class PaginationRowNumberHelper
{
    /// <summary>
    /// Sets RowNumber on each item: (currentPage - 1) * pageSize + index + 1.
    /// </summary>
    public static void Apply<T>(IList<T> pageItems, int currentPage, int pageSize)
        where T : IPageRowNumber
    {
        var start = (currentPage - 1) * pageSize;
        for (var i = 0; i < pageItems.Count; i++)
        {
            pageItems[i].RowNumber = start + i + 1;
        }
    }
}
