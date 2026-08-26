using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BV87.Core.Models;

namespace BV87.Core.Api;

public sealed class AuthApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;

    public AuthApiClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<DesktopLoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.PostAsJsonAsync("/api/auth/desktop/login", request, cancellationToken);
        return await ReadSuccessAsync<DesktopLoginResponse>(response, cancellationToken);
    }

    public async Task<DesktopLoginResponse> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var body = new DesktopRefreshRequest { RefreshToken = refreshToken };
        var response = await _httpClient.PostAsJsonAsync("/api/auth/desktop/refresh", body, cancellationToken);
        return await ReadSuccessAsync<DesktopLoginResponse>(response, cancellationToken);
    }

    public async Task<UserProfile> GetMeAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        return await ReadSuccessAsync<UserProfile>(response, cancellationToken);
    }

    private static async Task<T> ReadSuccessAsync<T>(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode)
        {
            var payload = await response.Content.ReadFromJsonAsync<T>(JsonOptions, cancellationToken);
            if (payload == null)
            {
                throw new ApiException("Phản hồi API không hợp lệ");
            }
            return payload;
        }

        ApiErrorResponse? error = null;
        try
        {
            error = await response.Content.ReadFromJsonAsync<ApiErrorResponse>(JsonOptions, cancellationToken);
        }
        catch (JsonException)
        {
            // ignore parse errors
        }

        throw new ApiException(error?.Message ?? $"Lỗi API ({(int)response.StatusCode})");
    }
}
