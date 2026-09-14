namespace BV87.App.Helpers;

/// <summary>
/// D-UI.32 — first paint may use IsLoading (empty grid); later search/refresh must use IsRefreshing only.
/// </summary>
public static class ListLoadBusy
{
    public static void Begin(ref bool hasLoadedOnce, Action<bool> setLoading, Action<bool> setRefreshing)
    {
        if (hasLoadedOnce)
        {
            setRefreshing(true);
        }
        else
        {
            setLoading(true);
        }
    }

        public static void End(ref bool hasLoadedOnce, Action<bool> setLoading, Action<bool> setRefreshing)
    {
        hasLoadedOnce = true;
        setLoading(false);
        setRefreshing(false);
    }

    /// <summary>D-UI.48 — client-side search still shows the page overlay.</summary>
    public static void RunRefreshing(Action<bool> setRefreshing, Action work)
    {
        setRefreshing(true);
        try
        {
            work();
        }
        finally
        {
            setRefreshing(false);
        }
    }
}
