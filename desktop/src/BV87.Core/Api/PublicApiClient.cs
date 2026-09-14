using System.IO;
using System.Net.Http.Json;
using BV87.Core.Models.Admin;

namespace BV87.Core.Api;

/// <summary>Unauthenticated public REST client — login branding bootstrap.</summary>
public sealed class PublicApiClient
{
    private readonly HttpClient _httpClient;

    public PublicApiClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public Task<BrandingDto> GetBrandingAsync(CancellationToken cancellationToken = default) =>
        SendGetAsync<BrandingDto>("/api/public/branding", cancellationToken);

    private async Task<T> SendGetAsync<T>(string path, CancellationToken cancellationToken)
    {
        var response = await _httpClient.GetAsync(path, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new ApiException($"Không tải được cấu hình giao diện ({(int)response.StatusCode})");
        }

        var payload = await response.Content.ReadFromJsonAsync<T>(cancellationToken: cancellationToken);
        if (payload == null)
        {
            throw new ApiException("Phản hồi API không hợp lệ");
        }

        return payload;
    }
}
