using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BV87.Core.Helpers;
using BV87.Core.Models;
using BV87.Core.Models.Kiosk;

namespace BV87.Core.Api;

/// <summary>Kiosk Agent HTTP client — authenticated via X-Kiosk-Token (no JWT).</summary>
public sealed class KioskApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;
    private readonly string _kioskToken;

    public KioskApiClient(HttpClient httpClient, string kioskToken)
    {
        _httpClient = httpClient;
        _kioskToken = kioskToken;
    }

    public static KioskApiClient Create(string apiBaseUrl, string kioskToken)
    {
        var handler = new HttpClientHandler { UseCookies = false };
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri(apiBaseUrl.TrimEnd('/') + "/"),
            Timeout = TimeSpan.FromSeconds(60)
        };
        ClientMachineInfo.ApplyClientIpHeader(httpClient);
        return new KioskApiClient(httpClient, kioskToken);
    }

    public async Task<KioskHealthDto> GetHealthAsync(CancellationToken cancellationToken = default)
    {
        return await GetAsync<KioskHealthDto>("/api/kiosk/health", cancellationToken);
    }

    public async Task<List<KioskTemplateDto>> ListTemplatesAsync(CancellationToken cancellationToken = default)
    {
        return await GetAsync<List<KioskTemplateDto>>("/api/kiosk/fingerprints/templates", cancellationToken)
               ?? [];
    }

    public async Task<FingerprintScanResultDto> ScanAsync(
        int empCode,
        int score,
        CancellationToken cancellationToken = default)
    {
        var body = new FingerprintScanRequest
        {
            EmpCode = empCode,
            Score = score,
            ClientHostname = ClientMachineInfo.LocalHostname(),
            ClientIp = ClientMachineInfo.LocalLanIpv4()
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "api/kiosk/fingerprints/scan")
        {
            Content = JsonContent.Create(body, options: JsonOptions)
        };
        ApplyHeaders(request);

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(8));

        var response = await _httpClient.SendAsync(request, cts.Token);
        return await ReadSuccessAsync<FingerprintScanResultDto>(response, cts.Token);
    }

    public async Task SendHeartbeatAsync(CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "api/kiosk/heartbeat")
        {
            Content = JsonContent.Create(new { }, options: JsonOptions)
        };
        ApplyHeaders(request);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        _ = await ReadSuccessAsync<KioskHeartbeatResponse>(response, cancellationToken);
    }

    private async Task<T> GetAsync<T>(string path, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, path.TrimStart('/'));
        ApplyHeaders(request);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        return await ReadSuccessAsync<T>(response, cancellationToken);
    }

    private void ApplyHeaders(HttpRequestMessage request)
    {
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.TryAddWithoutValidation("X-Kiosk-Token", _kioskToken);
        var clientIp = ClientMachineInfo.LocalLanIpv4();
        if (!string.IsNullOrWhiteSpace(clientIp))
        {
            request.Headers.TryAddWithoutValidation(ClientMachineInfo.ClientIpHeader, clientIp);
        }
    }

    private static async Task<T> ReadSuccessAsync<T>(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode)
        {
            var payload = await response.Content.ReadFromJsonAsync<T>(JsonOptions, cancellationToken);
            if (payload == null)
            {
                throw new ApiException("Phản hồi API rỗng");
            }

            return payload;
        }

        var error = await response.Content.ReadFromJsonAsync<ApiErrorResponse>(JsonOptions, cancellationToken);
        var message = error?.Message;
        if (string.IsNullOrWhiteSpace(message))
        {
            message = $"HTTP {(int)response.StatusCode}";
        }

        throw new ApiException(message);
    }

}
