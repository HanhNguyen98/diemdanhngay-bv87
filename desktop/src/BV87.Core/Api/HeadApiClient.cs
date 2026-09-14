using BV87.Core.Models.Admin;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.Core.Api;

/// <summary>HEAD REST client — fingerprint management for own department.</summary>
public sealed class HeadApiClient
{
    private readonly Bv87ApiClient _api;

    public HeadApiClient(Bv87ApiClient api)
    {
        _api = api;
    }

    public Task<List<FingerprintStatusDto>> ListFingerprintsAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<List<FingerprintStatusDto>>("/api/head/fingerprints", null, cancellationToken);

    public Task<List<AdminStaffDto>> ListStaffAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<List<AdminStaffDto>>("/api/head/staff", null, cancellationToken);

    public Task<AdminStaffDto> UpdateStaffAvatarAsync(
        int empCode,
        string? avatarUrl,
        CancellationToken cancellationToken = default) =>
        _api.PatchAsync<StaffAvatarUpdateRequest, AdminStaffDto>(
            $"/api/head/staff/{empCode}/avatar",
            new StaffAvatarUpdateRequest { AvatarUrl = avatarUrl },
            cancellationToken);

    public Task<ApiMessageResult> DeleteFingerprintAsync(
        int empCode,
        CancellationToken cancellationToken = default) =>
        _api.DeleteAsync<ApiMessageResult>(
            $"/api/head/fingerprints/{empCode}",
            cancellationToken);

    public Task<FingerprintStatusDto> EnrollFingerprintAsync(
        FingerprintEnrollRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<FingerprintEnrollRequest, FingerprintStatusDto>(
            "/api/head/fingerprints/enroll",
            request,
            null,
            cancellationToken);
}
