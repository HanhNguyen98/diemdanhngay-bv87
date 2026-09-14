using System.Net;
using System.Net.Sockets;

namespace BV87.Core.Security;

/// <summary>Validates API base URL is hospital LAN when lanOnlyEnabled (parity SPEC_FINGERPRINT §8.1).</summary>
public static class LanEndpointGuard
{
    private static readonly string[] BlockedHostFragments =
    [
        "cloudflare",
        "ngrok",
        "trycloudflare",
        "loca.lt"
    ];

    private static readonly string[] DefaultAllowedCidrs =
    [
        "127.0.0.1/32",
        "::1/128",
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "192.170.0.0/16"
    ];

    /// <summary>
    /// Returns null if allowed; otherwise Vietnamese error message for UI.
    /// </summary>
    public static string? ValidateApiBaseUrl(string? apiBaseUrl, bool lanOnlyEnabled)
    {
        if (!lanOnlyEnabled)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(apiBaseUrl))
        {
            return "Thiếu địa chỉ máy chủ API. Kiểm tra appsettings.json hoặc agent.config.json.";
        }

        if (!Uri.TryCreate(apiBaseUrl.Trim(), UriKind.Absolute, out var uri))
        {
            return "Địa chỉ API không hợp lệ.";
        }

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return "API chỉ hỗ trợ http hoặc https.";
        }

        var host = uri.Host;
        if (string.IsNullOrWhiteSpace(host))
        {
            return "Thiếu tên máy chủ API.";
        }

        var hostLower = host.ToLowerInvariant();
        foreach (var fragment in BlockedHostFragments)
        {
            if (hostLower.Contains(fragment, StringComparison.Ordinal))
            {
                return "Ứng dụng chỉ dùng trên mạng nội bộ bệnh viện. Không được trỏ API qua Internet công cộng.";
            }
        }

        if (IsLoopbackHost(hostLower))
        {
            return null;
        }

        var matcher = new CidrMatcher(DefaultAllowedCidrs);
        if (IPAddress.TryParse(host, out var parsedIp))
        {
            return matcher.Contains(parsedIp)
                ? null
                : "Máy chủ API phải nằm trong dải mạng LAN bệnh viện.";
        }

        try
        {
            var addresses = Dns.GetHostAddresses(host);
            if (addresses.Length == 0)
            {
                return "Không phân giải được tên máy chủ API.";
            }

            foreach (var address in addresses)
            {
                if (!matcher.Contains(address))
                {
                    return "Máy chủ API phải nằm trong dải mạng LAN bệnh viện.";
                }
            }

            return null;
        }
        catch
        {
            return "Không phân giải được tên máy chủ API.";
        }
    }

    private static bool IsLoopbackHost(string hostLower) =>
        hostLower is "localhost" or "127.0.0.1" or "::1" or "[::1]";

    private sealed class CidrMatcher
    {
        private readonly List<Cidr> _cidrs;

        public CidrMatcher(IEnumerable<string> cidrStrings)
        {
            _cidrs = cidrStrings.Select(Cidr.Parse).ToList();
        }

        public bool Contains(IPAddress address)
        {
            if (address.IsIPv4MappedToIPv6)
            {
                address = address.MapToIPv4();
            }

            var bytes = address.GetAddressBytes();
            return _cidrs.Any(cidr => cidr.Contains(bytes));
        }
    }

    private sealed record Cidr(byte[] Network, int PrefixLength)
    {
        public static Cidr Parse(string cidr)
        {
            var parts = cidr.Split('/');
            var network = IPAddress.Parse(parts[0].Trim());
            var max = network.GetAddressBytes().Length * 8;
            var prefix = parts.Length > 1 ? int.Parse(parts[1].Trim()) : max;
            if (prefix is < 0 or > 128)
            {
                throw new ArgumentException($"Invalid prefix: {cidr}");
            }

            return new Cidr(network.GetAddressBytes(), prefix);
        }

        public bool Contains(byte[] address)
        {
            if (address.Length != Network.Length)
            {
                return false;
            }

            var fullBytes = PrefixLength / 8;
            var remBits = PrefixLength % 8;
            for (var i = 0; i < fullBytes; i++)
            {
                if (address[i] != Network[i])
                {
                    return false;
                }
            }

            if (remBits == 0)
            {
                return true;
            }

            var mask = (byte)(0xFF << (8 - remBits));
            return (address[fullBytes] & mask) == (Network[fullBytes] & mask);
        }
    }
}
