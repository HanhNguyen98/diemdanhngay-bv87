using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;

namespace BV87.Core.Helpers;

/// <summary>LAN IPv4 of this PC for audit headers (SPEC D-UI.55).</summary>
public static class ClientMachineInfo
{
    public const string ClientIpHeader = "X-Client-Ip";

    /// <summary>First non-loopback IPv4 on an up NIC; otherwise loopback; otherwise empty.</summary>
    public static string LocalLanIpv4()
    {
        try
        {
            foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (nic.OperationalStatus != OperationalStatus.Up)
                {
                    continue;
                }

                if (nic.NetworkInterfaceType is NetworkInterfaceType.Loopback or NetworkInterfaceType.Tunnel)
                {
                    continue;
                }

                foreach (var unicast in nic.GetIPProperties().UnicastAddresses)
                {
                    var address = unicast.Address;
                    if (address.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(address))
                    {
                        return address.ToString();
                    }
                }
            }
        }
        catch
        {
            // fall through to DNS
        }

        try
        {
            var host = Dns.GetHostEntry(Dns.GetHostName());
            foreach (var address in host.AddressList)
            {
                if (address.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(address))
                {
                    return address.ToString();
                }
            }
        }
        catch
        {
            // ignored
        }

        return string.Empty;
    }

    public static string LocalHostname()
    {
        try
        {
            return Environment.MachineName;
        }
        catch
        {
            return string.Empty;
        }
    }

    /// <summary>Sets <c>X-Client-Ip</c> on the client for enroll/delete audit.</summary>
    public static void ApplyClientIpHeader(HttpClient httpClient)
    {
        var ip = LocalLanIpv4();
        if (string.IsNullOrWhiteSpace(ip))
        {
            return;
        }

        httpClient.DefaultRequestHeaders.Remove(ClientIpHeader);
        httpClient.DefaultRequestHeaders.TryAddWithoutValidation(ClientIpHeader, ip);
    }
}
