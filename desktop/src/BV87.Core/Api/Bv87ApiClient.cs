using System.Net.Http.Json;
using System.Text.Json;
using BV87.Core.Models;
using BV87.Core.Models.Admin;
using BV87.Core.Session;

namespace BV87.Core.Api;

/// <summary>Authenticated HTTP client for BV87 API calls.</summary>
public sealed class Bv87ApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;

    public Bv87ApiClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<T> GetAsync<T>(
        string path,
        IEnumerable<KeyValuePair<string, string?>>? query = null,
        CancellationToken cancellationToken = default)
    {
        var url = BuildUrl(path, query);
        var response = await _httpClient.GetAsync(url, cancellationToken);
        return await ReadSuccessAsync<T>(response, cancellationToken);
    }

    public async Task<TResponse> PutAsync<TRequest, TResponse>(
        string path,
        TRequest body,
        IEnumerable<KeyValuePair<string, string?>>? query = null,
        CancellationToken cancellationToken = default)
    {
        var url = BuildUrl(path, query);
        var response = await _httpClient.PutAsJsonAsync(url, body, cancellationToken);
        return await ReadSuccessAsync<TResponse>(response, cancellationToken);
    }

    public async Task<TResponse> PostAsync<TRequest, TResponse>(
        string path,
        TRequest body,
        IEnumerable<KeyValuePair<string, string?>>? query = null,
        CancellationToken cancellationToken = default)
    {
        var url = BuildUrl(path, query);
        var response = await _httpClient.PostAsJsonAsync(url, body, cancellationToken);
        return await ReadSuccessAsync<TResponse>(response, cancellationToken);
    }

    public async Task<TResponse> PostEmptyAsync<TResponse>(
        string path,
        CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.PostAsync(path, null, cancellationToken);
        return await ReadSuccessAsync<TResponse>(response, cancellationToken);
    }

    public async Task<TResponse> DeleteAsync<TResponse>(
        string path,
        CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.DeleteAsync(path, cancellationToken);
        return await ReadSuccessAsync<TResponse>(response, cancellationToken);
    }

    public async Task<TResponse> PatchAsync<TRequest, TResponse>(
        string path,
        TRequest body,
        CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.PatchAsJsonAsync(path, body, cancellationToken);
        return await ReadSuccessAsync<TResponse>(response, cancellationToken);
    }

    public async Task<TResponse> PatchAsync<TResponse>(
        string path,
        CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Patch, path);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        return await ReadSuccessAsync<TResponse>(response, cancellationToken);
    }

    public Task<ApiMessageResult> ChangePasswordAsync(
        ChangePasswordRequest request,
        CancellationToken cancellationToken = default) =>
        PostAsync<ChangePasswordRequest, ApiMessageResult>(
            "/api/auth/change-password",
            request,
            null,
            cancellationToken);

    private static string BuildUrl(string path, IEnumerable<KeyValuePair<string, string?>>? query)
    {
        if (query == null)
        {
            return path;
        }

        var parts = query
            .Where(kv => !string.IsNullOrWhiteSpace(kv.Value))
            .Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value!)}")
            .ToList();

        return parts.Count == 0 ? path : $"{path}?{string.Join("&", parts)}";
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

        Models.ApiErrorResponse? error = null;
        try
        {
            error = await response.Content.ReadFromJsonAsync<Models.ApiErrorResponse>(JsonOptions, cancellationToken);
        }
        catch (JsonException)
        {
            // ignore
        }

        throw new ApiException(error?.Message ?? $"Lỗi API ({(int)response.StatusCode})");
    }
}
