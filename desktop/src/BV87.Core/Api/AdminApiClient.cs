using BV87.Core.Models.Admin;
using BV87.Core.Models.Admin.Catalog;
using BV87.Core.Models.Attendance;

namespace BV87.Core.Api;

/// <summary>Admin portal REST client — mirrors frontend adminApi.</summary>
public sealed class AdminApiClient
{
    private readonly Bv87ApiClient _api;

    public AdminApiClient(Bv87ApiClient api)
    {
        _api = api;
    }

    public Task<AdminDashboardResponse> GetDashboardAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<AdminDashboardResponse>("/api/admin/dashboard", null, cancellationToken);

    public Task<ServerStorageResponse> GetServerStorageAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<ServerStorageResponse>("/api/admin/system/storage", null, cancellationToken);

    public Task<List<DepartmentListItem>> ListDepartmentsAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<List<DepartmentListItem>>("/api/admin/departments", null, cancellationToken);

    public Task<SendReminderResult> SendRemindersAsync(
        IReadOnlyList<int> deptCodes,
        CancellationToken cancellationToken = default)
    {
        var body = new { deptCodes = deptCodes.ToList() };
        return _api.PostAsync<object, SendReminderResult>(
            "/api/admin/attendance/reminders",
            body,
            null,
            cancellationToken);
    }

    public Task<ToggleDeptLockResult> ToggleDeptLockAsync(
        int deptCode,
        CancellationToken cancellationToken = default) =>
        _api.PostEmptyAsync<ToggleDeptLockResult>(
            $"/api/admin/attendance/toggle-lock/{deptCode}",
            cancellationToken);

    public Task<ApiMessageResult> BlockReportAsync(
        int deptCode,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var body = new { deptCode, reason };
        return _api.PostAsync<object, ApiMessageResult>(
            "/api/admin/attendance/report-blocks",
            body,
            null,
            cancellationToken);
    }

    public Task<ApiMessageResult> UnblockReportAsync(
        int deptCode,
        CancellationToken cancellationToken = default) =>
        _api.DeleteAsync<ApiMessageResult>(
            $"/api/admin/attendance/report-blocks/{deptCode}",
            cancellationToken);

    public Task<ApiMessageResult> ApproveUnlockRequestAsync(
        long requestId,
        CancellationToken cancellationToken = default) =>
        _api.PostEmptyAsync<ApiMessageResult>(
            $"/api/admin/attendance/unlock-requests/{requestId}/approve",
            cancellationToken);

    public Task<StaffAttendanceRow> FillAttendanceTimesAsync(
        FillAttendanceTimesRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PutAsync<FillAttendanceTimesRequest, StaffAttendanceRow>(
            "/api/admin/attendance/times",
            request,
            null,
            cancellationToken);

    public Task<StaffAttendanceRow> ApprovePayrollFillAsync(
        PayrollFillApproveRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<PayrollFillApproveRequest, StaffAttendanceRow>(
            "/api/admin/attendance/payroll-fill/approve",
            request,
            null,
            cancellationToken);

    public Task<StaffAttendanceRow> ClearAttendanceAsync(
        ClearAttendanceRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<ClearAttendanceRequest, StaffAttendanceRow>(
            "/api/admin/attendance/clear",
            request,
            null,
            cancellationToken);

    public Task<UnlockRequestItemDto> RejectUnlockRequestAsync(
        long requestId,
        string? note,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<UnlockRejectRequest, UnlockRequestItemDto>(
            $"/api/admin/attendance/unlock-requests/{requestId}/reject",
            new UnlockRejectRequest { Note = note ?? string.Empty },
            null,
            cancellationToken);

    public Task<List<UnlockRequestItemDto>> ListUnlockRequestsAsync(
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        IEnumerable<KeyValuePair<string, string?>>? query = string.IsNullOrWhiteSpace(status)
            ? null
            : [new KeyValuePair<string, string?>("status", status)];
        return _api.GetAsync<List<UnlockRequestItemDto>>(
            "/api/admin/attendance/unlock-requests",
            query,
            cancellationToken);
    }

    public Task<ReminderHistoryDto> GetReminderHistoryAsync(
        DateOnly? from,
        DateOnly? to,
        CancellationToken cancellationToken = default)
    {
        var query = new List<KeyValuePair<string, string?>>();
        if (from != null)
        {
            query.Add(new KeyValuePair<string, string?>("from", from.Value.ToString("yyyy-MM-dd")));
        }

        if (to != null)
        {
            query.Add(new KeyValuePair<string, string?>("to", to.Value.ToString("yyyy-MM-dd")));
        }

        return _api.GetAsync<ReminderHistoryDto>(
            "/api/admin/attendance/reminder-history",
            query.Count > 0 ? query : null,
            cancellationToken);
    }

    public Task<AttendanceAuditLogPageDto> GetAttendanceAuditLogsAsync(
        DateOnly? from,
        DateOnly? to,
        int? deptCode,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new List<KeyValuePair<string, string?>>
        {
            new("page", page.ToString()),
            new("pageSize", pageSize.ToString())
        };

        if (from != null)
        {
            query.Add(new KeyValuePair<string, string?>("from", from.Value.ToString("yyyy-MM-dd")));
        }

        if (to != null)
        {
            query.Add(new KeyValuePair<string, string?>("to", to.Value.ToString("yyyy-MM-dd")));
        }

        if (deptCode != null)
        {
            query.Add(new KeyValuePair<string, string?>("deptCode", deptCode.Value.ToString()));
        }

        return _api.GetAsync<AttendanceAuditLogPageDto>(
            "/api/admin/attendance/audit-logs",
            query,
            cancellationToken);
    }

    public Task<List<StaffRankDto>> ListStaffRanksAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<List<StaffRankDto>>("/api/admin/staff-ranks", null, cancellationToken);

    public Task<ApiMessageResult> DeleteStaffFingerprintAsync(
        int empCode,
        CancellationToken cancellationToken = default) =>
        _api.DeleteAsync<ApiMessageResult>(
            $"/api/admin/fingerprints/{empCode}",
            cancellationToken);

    public Task<List<FingerprintStatusDto>> ListFingerprintsAsync(
        int? deptCode = null,
        CancellationToken cancellationToken = default)
    {
        IEnumerable<KeyValuePair<string, string?>>? query = deptCode != null
            ? [new KeyValuePair<string, string?>("deptCode", deptCode.Value.ToString())]
            : null;
        return _api.GetAsync<List<FingerprintStatusDto>>(
            "/api/admin/fingerprints",
            query,
            cancellationToken);
    }

    public Task<FingerprintStatusDto> EnrollFingerprintAsync(
        FingerprintEnrollRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<FingerprintEnrollRequest, FingerprintStatusDto>(
            "/api/admin/fingerprints/enroll",
            request,
            null,
            cancellationToken);

    public Task<FingerprintTemplateAuditLogPageDto> GetFingerprintTemplateAuditLogsAsync(
        DateOnly? from,
        DateOnly? to,
        int? deptCode,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new List<KeyValuePair<string, string?>>
        {
            new("page", page.ToString()),
            new("pageSize", pageSize.ToString())
        };

        if (from != null)
        {
            query.Add(new KeyValuePair<string, string?>("from", from.Value.ToString("yyyy-MM-dd")));
        }

        if (to != null)
        {
            query.Add(new KeyValuePair<string, string?>("to", to.Value.ToString("yyyy-MM-dd")));
        }

        if (deptCode != null)
        {
            query.Add(new KeyValuePair<string, string?>("deptCode", deptCode.Value.ToString()));
        }

        return _api.GetAsync<FingerprintTemplateAuditLogPageDto>(
            "/api/admin/fingerprints/audit-logs",
            query,
            cancellationToken);
    }

    public Task<NextCodeDto> GetNextStaffRankCodeAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<NextCodeDto>("/api/admin/staff-ranks/next-code", null, cancellationToken);

    public Task<StaffRankDto> CreateStaffRankAsync(
        StaffRankUpsertRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<StaffRankUpsertRequest, StaffRankDto>(
            "/api/admin/staff-ranks",
            request,
            null,
            cancellationToken);

    public Task<StaffRankDto> UpdateStaffRankAsync(
        int rankCode,
        StaffRankUpsertRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PutAsync<StaffRankUpsertRequest, StaffRankDto>(
            $"/api/admin/staff-ranks/{rankCode}",
            request,
            null,
            cancellationToken);

    public Task<ApiMessageResult> DeleteStaffRankAsync(
        int rankCode,
        CancellationToken cancellationToken = default) =>
        _api.DeleteAsync<ApiMessageResult>($"/api/admin/staff-ranks/{rankCode}", cancellationToken);

    public Task<List<StaffPositionDto>> ListStaffPositionsAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<List<StaffPositionDto>>("/api/admin/staff-positions", null, cancellationToken);

    public Task<NextCodeDto> GetNextStaffPositionCodeAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<NextCodeDto>("/api/admin/staff-positions/next-code", null, cancellationToken);

    public Task<StaffPositionDto> CreateStaffPositionAsync(
        StaffPositionUpsertRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<StaffPositionUpsertRequest, StaffPositionDto>(
            "/api/admin/staff-positions",
            request,
            null,
            cancellationToken);

    public Task<StaffPositionDto> UpdateStaffPositionAsync(
        int positionCode,
        StaffPositionUpsertRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PutAsync<StaffPositionUpsertRequest, StaffPositionDto>(
            $"/api/admin/staff-positions/{positionCode}",
            request,
            null,
            cancellationToken);

    public Task<ApiMessageResult> DeleteStaffPositionAsync(
        int positionCode,
        CancellationToken cancellationToken = default) =>
        _api.DeleteAsync<ApiMessageResult>($"/api/admin/staff-positions/{positionCode}", cancellationToken);

    public Task<List<AttendanceStatusTypeDto>> ListAttendanceStatusTypesAsync(
        CancellationToken cancellationToken = default) =>
        _api.GetAsync<List<AttendanceStatusTypeDto>>("/api/admin/attendance-status-types", null, cancellationToken);

    public Task<AttendanceStatusTypeDto> CreateAttendanceStatusTypeAsync(
        AttendanceStatusTypeUpsertRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<AttendanceStatusTypeUpsertRequest, AttendanceStatusTypeDto>(
            "/api/admin/attendance-status-types",
            request,
            null,
            cancellationToken);

    public Task<AttendanceStatusTypeDto> UpdateAttendanceStatusTypeAsync(
        long id,
        AttendanceStatusTypeUpsertRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PutAsync<AttendanceStatusTypeUpsertRequest, AttendanceStatusTypeDto>(
            $"/api/admin/attendance-status-types/{id}",
            request,
            null,
            cancellationToken);

    public Task<ApiMessageResult> DeleteAttendanceStatusTypeAsync(
        long id,
        CancellationToken cancellationToken = default) =>
        _api.DeleteAsync<ApiMessageResult>($"/api/admin/attendance-status-types/{id}", cancellationToken);

    public Task<AdminStatsDto> GetStatsAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<AdminStatsDto>("/api/admin/stats", null, cancellationToken);

    public Task<List<AdminDepartmentDto>> ListAdminDepartmentsAsync(
        int? groupCode = null,
        CancellationToken cancellationToken = default)
    {
        IEnumerable<KeyValuePair<string, string?>>? query = groupCode != null
            ? [new KeyValuePair<string, string?>("groupCode", groupCode.Value.ToString())]
            : null;
        return _api.GetAsync<List<AdminDepartmentDto>>("/api/admin/departments", query, cancellationToken);
    }

    public Task<NextCodeDto> GetNextDeptCodeAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<NextCodeDto>("/api/admin/departments/next-code", null, cancellationToken);

    public Task<AdminDepartmentDto> CreateDepartmentAsync(
        DepartmentUpsertRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<DepartmentUpsertRequest, AdminDepartmentDto>(
            "/api/admin/departments",
            request,
            null,
            cancellationToken);

    public Task<AdminDepartmentDto> UpdateDepartmentAsync(
        int deptCode,
        DepartmentUpsertRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PutAsync<DepartmentUpsertRequest, AdminDepartmentDto>(
            $"/api/admin/departments/{deptCode}",
            request,
            null,
            cancellationToken);

    public Task<ApiMessageResult> DeleteDepartmentAsync(
        int deptCode,
        CancellationToken cancellationToken = default) =>
        _api.DeleteAsync<ApiMessageResult>($"/api/admin/departments/{deptCode}", cancellationToken);

    public Task<List<AdminDepartmentGroupDto>> ListDepartmentGroupsAsync(
        CancellationToken cancellationToken = default) =>
        _api.GetAsync<List<AdminDepartmentGroupDto>>("/api/admin/department-groups", null, cancellationToken);

    public Task<NextCodeDto> GetNextGroupCodeAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<NextCodeDto>("/api/admin/department-groups/next-code", null, cancellationToken);

    public Task<AdminDepartmentGroupDto> CreateDepartmentGroupAsync(
        DepartmentGroupUpsertRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<DepartmentGroupUpsertRequest, AdminDepartmentGroupDto>(
            "/api/admin/department-groups",
            request,
            null,
            cancellationToken);

    public Task<AdminDepartmentGroupDto> UpdateDepartmentGroupAsync(
        int groupCode,
        DepartmentGroupUpsertRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PutAsync<DepartmentGroupUpsertRequest, AdminDepartmentGroupDto>(
            $"/api/admin/department-groups/{groupCode}",
            request,
            null,
            cancellationToken);

    public Task<ApiMessageResult> DeleteDepartmentGroupAsync(
        int groupCode,
        CancellationToken cancellationToken = default) =>
        _api.DeleteAsync<ApiMessageResult>($"/api/admin/department-groups/{groupCode}", cancellationToken);

    public Task<RegistryPageDto<AdminStaffDto>> ListStaffPageAsync(
        string? search = null,
        int? deptCode = null,
        int page = 1,
        int pageSize = 500,
        CancellationToken cancellationToken = default)
    {
        var query = new List<KeyValuePair<string, string?>>
        {
            new("page", page.ToString()),
            new("pageSize", pageSize.ToString())
        };
        if (!string.IsNullOrWhiteSpace(search))
        {
            query.Add(new KeyValuePair<string, string?>("search", search));
        }

        if (deptCode != null)
        {
            query.Add(new KeyValuePair<string, string?>("deptCode", deptCode.Value.ToString()));
        }

        return _api.GetAsync<RegistryPageDto<AdminStaffDto>>("/api/admin/staff", query, cancellationToken);
    }

    public Task<AdminStaffDto> GetStaffAsync(int empCode, CancellationToken cancellationToken = default) =>
        _api.GetAsync<AdminStaffDto>($"/api/admin/staff/{empCode}", null, cancellationToken);

    public Task<AdminStaffDto> CreateStaffAsync(
        StaffUpsertRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<StaffUpsertRequest, AdminStaffDto>(
            "/api/admin/staff",
            request,
            null,
            cancellationToken);

    public Task<AdminStaffDto> UpdateStaffAsync(
        int empCode,
        StaffUpsertRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PutAsync<StaffUpsertRequest, AdminStaffDto>(
            $"/api/admin/staff/{empCode}",
            request,
            null,
            cancellationToken);

    public Task<AdminStaffDto> TransferStaffAsync(
        int empCode,
        StaffTransferRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<StaffTransferRequest, AdminStaffDto>(
            $"/api/admin/staff/{empCode}/transfer",
            request,
            null,
            cancellationToken);

    public Task<ApiMessageResult> DeleteStaffAsync(
        int empCode,
        CancellationToken cancellationToken = default) =>
        _api.DeleteAsync<ApiMessageResult>($"/api/admin/staff/{empCode}", cancellationToken);

    public Task<List<StaffDepartmentAssignmentDto>> GetStaffDepartmentHistoryAsync(
        int empCode,
        CancellationToken cancellationToken = default) =>
        _api.GetAsync<List<StaffDepartmentAssignmentDto>>(
            $"/api/admin/staff/{empCode}/department-history",
            null,
            cancellationToken);

    public Task<BrandingDto> GetBrandingAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<BrandingDto>("/api/admin/settings/branding", null, cancellationToken);

    public Task<BrandingDto> UpdateBrandingAsync(
        BrandingUpdateRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PutAsync<BrandingUpdateRequest, BrandingDto>(
            "/api/admin/settings/branding",
            request,
            null,
            cancellationToken);

    public Task<AccountStatsDto> GetAccountStatsAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<AccountStatsDto>("/api/admin/accounts/stats", null, cancellationToken);

    public Task<RegistryPageDto<AdminAccountDto>> ListAccountsPageAsync(
        string? search = null,
        string? role = null,
        string? status = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new List<KeyValuePair<string, string?>>
        {
            new("page", page.ToString()),
            new("pageSize", pageSize.ToString())
        };
        if (!string.IsNullOrWhiteSpace(search))
        {
            query.Add(new KeyValuePair<string, string?>("search", search));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            query.Add(new KeyValuePair<string, string?>("role", role));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query.Add(new KeyValuePair<string, string?>("status", status));
        }

        return _api.GetAsync<RegistryPageDto<AdminAccountDto>>("/api/admin/accounts", query, cancellationToken);
    }

    public Task<AdminAccountDto> CreateAccountAsync(
        AccountUpsertRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<AccountUpsertRequest, AdminAccountDto>(
            "/api/admin/accounts",
            request,
            null,
            cancellationToken);

    public Task<AdminAccountDto> UpdateAccountAsync(
        long accountId,
        AccountUpsertRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PutAsync<AccountUpsertRequest, AdminAccountDto>(
            $"/api/admin/accounts/{accountId}",
            request,
            null,
            cancellationToken);

    public Task<ApiMessageResult> DeleteAccountAsync(
        long accountId,
        CancellationToken cancellationToken = default) =>
        _api.DeleteAsync<ApiMessageResult>($"/api/admin/accounts/{accountId}", cancellationToken);

    public Task<ApiMessageResult> ResetAccountPasswordAsync(
        long accountId,
        ResetPasswordRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<ResetPasswordRequest, ApiMessageResult>(
            $"/api/admin/accounts/{accountId}/reset-password",
            request,
            null,
            cancellationToken);

    public Task<List<KioskTokenDto>> ListKioskTokensAsync(CancellationToken cancellationToken = default) =>
        _api.GetAsync<List<KioskTokenDto>>("/api/admin/fingerprint/kiosk-tokens", null, cancellationToken);

    public Task<KioskTokenIssuedDto> CreateKioskTokenAsync(
        KioskTokenCreateRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<KioskTokenCreateRequest, KioskTokenIssuedDto>(
            "/api/admin/fingerprint/kiosk-tokens",
            request,
            null,
            cancellationToken);

    public Task<KioskTokenDto> UpdateKioskTokenLabelAsync(
        long id,
        KioskTokenUpdateLabelRequest request,
        CancellationToken cancellationToken = default) =>
        _api.PostAsync<KioskTokenUpdateLabelRequest, KioskTokenDto>(
            $"/api/admin/fingerprint/kiosk-tokens/{id}/label",
            request,
            null,
            cancellationToken);

    public Task<ApiMessageResult> RevokeKioskTokenAsync(
        long id,
        CancellationToken cancellationToken = default) =>
        _api.PostEmptyAsync<ApiMessageResult>(
            $"/api/admin/fingerprint/kiosk-tokens/{id}/revoke",
            cancellationToken);

    public Task<KioskTokenIssuedDto> RotateKioskTokenAsync(
        long id,
        CancellationToken cancellationToken = default) =>
        _api.PostEmptyAsync<KioskTokenIssuedDto>(
            $"/api/admin/fingerprint/kiosk-tokens/{id}/rotate",
            cancellationToken);
}
