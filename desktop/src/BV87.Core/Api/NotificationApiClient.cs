using BV87.Core.Models;
using BV87.Core.Models.Admin;

namespace BV87.Core.Api;

public sealed class NotificationApiClient
{
    private readonly Bv87ApiClient _api;

    public NotificationApiClient(Bv87ApiClient api)
    {
        _api = api;
    }

    public Task<List<NotificationItem>> ListAsync(CancellationToken ct = default) =>
        _api.GetAsync<List<NotificationItem>>("/api/notifications", null, ct);

    public Task<NotificationUnreadCountResponse> GetUnreadCountAsync(CancellationToken ct = default) =>
        _api.GetAsync<NotificationUnreadCountResponse>("/api/notifications/unread-count", null, ct);

    public Task<ApiMessageResult> MarkReadAsync(long id, CancellationToken cancellationToken = default) =>
        _api.PatchAsync<ApiMessageResult>($"/api/notifications/{id}/read", cancellationToken);

    public Task<ApiMessageResult> MarkAllReadAsync(CancellationToken cancellationToken = default) =>
        _api.PatchAsync<ApiMessageResult>("/api/notifications/read-all", cancellationToken);
}
