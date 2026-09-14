namespace BV87.Core.Helpers;

/// <summary>Named Win32 objects for same-PC USB yield between agent and enroll (SPEC D1.2d / D1.2e).</summary>
public static class WpfUsbShareNames
{
    public const string AgentRunningMutex = @"Local\BV87.WpfAgent.Running";
    public const string EnrollLeaseMutex = @"Local\BV87.Enroll.UsbLease";
    public const string AgentYieldedEvent = @"Local\BV87.Usb.AgentYielded";
}
