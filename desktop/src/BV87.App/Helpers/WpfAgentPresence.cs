using System.Management;
using BV87.Core.Helpers;

namespace BV87.App.Helpers;

/// <summary>Detects a running WPF kiosk agent on this PC (SPEC §2.22 D1.2d / D1.2f). Does not kill the process.</summary>
public static class WpfAgentPresence
{
    public const string MutexName = WpfUsbShareNames.AgentRunningMutex;

    private static Mutex? _held;

    /// <summary>
    /// Exclusive claim of the agent mutex for this process.
    /// </summary>
    /// <returns><c>false</c> when another live <c>--agent</c> already owns the mutex.</returns>
    public static bool TryClaimExclusiveForThisProcess()
    {
        if (_held != null)
        {
            return true;
        }

        try
        {
            _held = new Mutex(initiallyOwned: true, MutexName, out var createdNew);
            if (createdNew)
            {
                return true;
            }

            _held.Dispose();
            _held = null;
            return false;
        }
        catch (AbandonedMutexException ex)
        {
            _held = ex.Mutex ?? new Mutex(initiallyOwned: true, MutexName);
            return true;
        }
        catch (UnauthorizedAccessException)
        {
            return false;
        }
    }

    /// <summary>Keeps the named mutex alive for this agent process (non-exclusive open — tests / fallback).</summary>
    public static void ClaimForThisProcess() => TryClaimExclusiveForThisProcess();

    /// <summary>True when another BV87 process is running as <c>--agent</c>.</summary>
    public static bool IsKioskAgentRunning()
    {
        if (IsCurrentProcessAgent())
        {
            return false;
        }

        if (IsMutexPresent())
        {
            return true;
        }

        return HasAgentCommandLineOnOtherProcess();
    }

    private static bool IsCurrentProcessAgent()
    {
        return WpfAgentCommandLine.ContainsAgentSwitch(Environment.CommandLine);
    }

    private static bool IsMutexPresent()
    {
        try
        {
            if (Mutex.TryOpenExisting(MutexName, out var existing))
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

    private static bool HasAgentCommandLineOnOtherProcess()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher(
                "SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name = 'BV87.exe'");
            foreach (var raw in searcher.Get())
            {
                using var obj = (ManagementObject)raw;
                var pid = Convert.ToInt32(obj["ProcessId"]);
                if (pid == Environment.ProcessId)
                {
                    continue;
                }

                var commandLine = obj["CommandLine"]?.ToString();
                if (WpfAgentCommandLine.ContainsAgentSwitch(commandLine))
                {
                    return true;
                }
            }
        }
        catch (Exception)
        {
            // WMI unavailable — mutex is the primary signal.
        }

        return false;
    }
}
