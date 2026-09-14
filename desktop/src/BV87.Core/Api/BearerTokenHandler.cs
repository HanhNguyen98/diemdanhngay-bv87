using System.Net.Http.Headers;
using System.Net.Http.Json;
using BV87.Core.Session;

namespace BV87.Core.Api;

/// <summary>Adds Bearer token, proactive refresh, and one 401 retry (SPEC_DESKTOP §2.3).</summary>
public sealed class BearerTokenHandler : DelegatingHandler
{
    private readonly SessionManager _sessionManager;

    public BearerTokenHandler(SessionManager sessionManager)
    {
        _sessionManager = sessionManager;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        await AttachTokenAsync(request, cancellationToken);

        var response = await base.SendAsync(request, cancellationToken);
        if (response.StatusCode != System.Net.HttpStatusCode.Unauthorized)
        {
            return response;
        }

        response.Dispose();
        if (!await _sessionManager.RefreshTokensAsync(cancellationToken, force: true))
        {
            _sessionManager.NotifySessionExpired();
            throw new ApiException("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        using var retry = await CloneRequestAsync(request);
        await AttachTokenAsync(retry, cancellationToken);
        return await base.SendAsync(retry, cancellationToken);
    }

    private async Task AttachTokenAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        await _sessionManager.EnsureValidAccessTokenAsync(cancellationToken);
        var token = _sessionManager.Session.AccessToken;
        if (!string.IsNullOrWhiteSpace(token))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
    }

    private static async Task<HttpRequestMessage> CloneRequestAsync(HttpRequestMessage request)
    {
        var clone = new HttpRequestMessage(request.Method, request.RequestUri);
        if (request.Content != null)
        {
            var bytes = await request.Content.ReadAsByteArrayAsync();
            clone.Content = new ByteArrayContent(bytes);
            foreach (var header in request.Content.Headers)
            {
                clone.Content.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
        }

        foreach (var header in request.Headers)
        {
            clone.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }

        return clone;
    }
}
