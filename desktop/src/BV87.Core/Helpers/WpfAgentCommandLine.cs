namespace BV87.Core.Helpers;

/// <summary>Parses BV87 process command lines for kiosk agent mode (SPEC §2.22 D1.2d).</summary>
public static class WpfAgentCommandLine
{
    public const string AgentSwitch = "--agent";

    /// <summary>True when <paramref name="commandLine"/> has a standalone <c>--agent</c> token.</summary>
    public static bool ContainsAgentSwitch(string? commandLine)
    {
        if (string.IsNullOrWhiteSpace(commandLine))
        {
            return false;
        }

        var parts = commandLine.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        foreach (var part in parts)
        {
            if (part.Equals(AgentSwitch, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
