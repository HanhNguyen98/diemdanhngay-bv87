namespace BV87.Core.Config;

/// <summary>
/// Release builds for hospital ZIP always enforce LAN-only API endpoints (SPEC §1.1 D1.3).
/// Debug builds respect appsettings.json / agent.config.json for local dev.
/// </summary>
public static class LanDeploymentPolicy
{
#if BV87_RELEASE_LAN_ONLY
    public static bool ForceLanOnlyEnabled => true;
#else
    public static bool ForceLanOnlyEnabled => false;
#endif

    public static void Apply(AppConfig config)
    {
        if (ForceLanOnlyEnabled)
        {
            config.LanOnlyEnabled = true;
        }
    }

    public static void Apply(AgentConfig config)
    {
        if (ForceLanOnlyEnabled)
        {
            config.LanOnlyEnabled = true;
        }
    }
}
