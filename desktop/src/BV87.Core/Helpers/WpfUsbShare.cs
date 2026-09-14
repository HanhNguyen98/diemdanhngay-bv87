namespace BV87.Core.Helpers;

/// <summary>Cross-process USB lease: enroll holds the scanner; agent yields and reclaims (SPEC D1.2e).</summary>
public static class WpfUsbShare
{
    public const int AgentPollMs = 400;
    public const int EnrollYieldWaitMs = 8_000;

    private static Mutex? _enrollLease;

    /// <summary>Enroll keeps this handle while the page is open so the agent will release USB.</summary>
    public static void ClaimEnrollLease()
    {
        if (_enrollLease != null)
        {
            return;
        }

        try
        {
            _enrollLease = new Mutex(initiallyOwned: false, WpfUsbShareNames.EnrollLeaseMutex);
        }
        catch (AbandonedMutexException)
        {
            _enrollLease = new Mutex(initiallyOwned: false, WpfUsbShareNames.EnrollLeaseMutex);
        }
        catch (UnauthorizedAccessException)
        {
            // Agent still sees the existing named object.
        }
    }

    /// <summary>Call after enroll <c>Disconnect</c> so the agent may reopen the scanner.</summary>
    public static void ReleaseEnrollLease()
    {
        _enrollLease?.Dispose();
        _enrollLease = null;
    }

    /// <summary>True when any enroll process is holding the USB lease.</summary>
    public static bool IsEnrollLeaseHeld()
    {
        try
        {
            if (Mutex.TryOpenExisting(WpfUsbShareNames.EnrollLeaseMutex, out var existing))
            {
                existing.Dispose();
                return true;
            }
        }
        catch (WaitHandleCannotBeOpenedException)
        {
        }
        catch (UnauthorizedAccessException)
        {
            return true;
        }

        return false;
    }

    /// <summary>Agent signals after <c>Disconnect</c>; enroll waits before <c>OpenDevice</c>.</summary>
    public static void SignalAgentYielded()
    {
        using var ev = OpenOrCreateYieldedEvent();
        ev.Set();
    }

    /// <summary>Agent clears the event when it intends to reclaim USB.</summary>
    public static void ClearAgentYielded()
    {
        using var ev = OpenOrCreateYieldedEvent();
        ev.Reset();
    }

    /// <summary>True when the agent has published a yield (or enroll created an unsignaled event).</summary>
    public static bool IsAgentYielded()
    {
        using var ev = OpenOrCreateYieldedEvent();
        return ev.WaitOne(0);
    }

    /// <param name="timeout">How long enroll waits for the agent to disconnect.</param>
    /// <param name="cancellationToken">Page dispose / cancel.</param>
    /// <returns>True if the agent signaled yield before timeout.</returns>
    public static bool WaitUntilAgentYielded(TimeSpan timeout, CancellationToken cancellationToken = default)
    {
        using var ev = OpenOrCreateYieldedEvent();
        if (!cancellationToken.CanBeCanceled)
        {
            return ev.WaitOne(timeout);
        }

        var signaled = WaitHandle.WaitAny([ev, cancellationToken.WaitHandle], timeout);
        return signaled == 0;
    }

    private static EventWaitHandle OpenOrCreateYieldedEvent()
    {
        return new EventWaitHandle(false, EventResetMode.ManualReset, WpfUsbShareNames.AgentYieldedEvent);
    }
}
