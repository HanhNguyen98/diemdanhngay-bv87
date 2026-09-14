namespace BV87.App.Helpers;

/// <summary>One slot in a pagination page-number strip (page index or ellipsis).</summary>
public sealed class PaginationPageItem
{
    public bool IsEllipsis { get; init; }

    public int PageNumber { get; init; }

    public bool IsCurrent { get; init; }
}

/// <summary>Builds page-number ranges with ellipsis for table pagination bars.</summary>
public static class PaginationPageRange
{
    /// <summary>
    /// Returns page numbers and ellipsis markers for the center nav strip.
    /// When totalPages &lt;= 7 every page is listed; otherwise ellipsis separates clusters.
    /// </summary>
    public static IReadOnlyList<PaginationPageItem> Build(int currentPage, int totalPages)
    {
        if (totalPages <= 0)
        {
            return
            [
                new PaginationPageItem
                {
                    PageNumber = 1,
                    IsCurrent = currentPage <= 1
                }
            ];
        }

        if (totalPages <= 7)
        {
            return Enumerable.Range(1, totalPages)
                .Select(page => new PaginationPageItem
                {
                    PageNumber = page,
                    IsCurrent = page == currentPage
                })
                .ToList();
        }

        var pages = new HashSet<int> { 1, totalPages, currentPage, currentPage - 1, currentPage + 1 };
        var sorted = pages.Where(page => page >= 1 && page <= totalPages).OrderBy(page => page).ToList();

        var result = new List<PaginationPageItem>();
        for (var i = 0; i < sorted.Count; i++)
        {
            if (i > 0 && sorted[i] - sorted[i - 1] > 1)
            {
                result.Add(new PaginationPageItem { IsEllipsis = true });
            }

            var pageNumber = sorted[i];
            result.Add(new PaginationPageItem
            {
                PageNumber = pageNumber,
                IsCurrent = pageNumber == currentPage
            });
        }

        return result;
    }
}
