using BV87.Core.Helpers;

namespace BV87.Core.Api;

/// <summary>Factory for Auth (plain) and authenticated BV87 HTTP clients.</summary>
public static class Bv87HttpClientFactory
{
    /// <summary>D-AUTH.1b — desktop must not send/receive Web session cookies.</summary>
    private static HttpClientHandler CreateHandler() => new() { UseCookies = false };

    public static AuthApiClient CreateAuthClient(string apiBaseUrl)
    {
        return new AuthApiClient(CreateBaseClient(apiBaseUrl));
    }

    public static PublicApiClient CreatePublicClient(string apiBaseUrl)
    {
        return new PublicApiClient(CreateBaseClient(apiBaseUrl));
    }

    public static Bv87ApiClient CreateApiClient(string apiBaseUrl, Session.SessionManager sessionManager)
    {
        var handler = new BearerTokenHandler(sessionManager)
        {
            InnerHandler = CreateHandler()
        };
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri(apiBaseUrl.TrimEnd('/') + "/"),
            Timeout = TimeSpan.FromSeconds(60)
        };
        ClientMachineInfo.ApplyClientIpHeader(httpClient);
        return new Bv87ApiClient(httpClient);
    }

    private static HttpClient CreateBaseClient(string apiBaseUrl)
    {
        var httpClient = new HttpClient(CreateHandler())
        {
            BaseAddress = new Uri(apiBaseUrl.TrimEnd('/') + "/"),
            Timeout = TimeSpan.FromSeconds(60)
        };
        ClientMachineInfo.ApplyClientIpHeader(httpClient);
        return httpClient;
    }
}
