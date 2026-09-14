using BV87.Core.Helpers;
using BV87.Core.Models.Admin;
using BV87.Core.Models.Attendance;

namespace BV87.Core.Api;

public sealed class AttendanceApiClient
{
    private readonly Bv87ApiClient _api;

    public AttendanceApiClient(Bv87ApiClient api)
    {
        _api = api;
    }

    public Task<AttendancePageResponse> GetAttendancePageAsync(int deptCode, DateOnly date, CancellationToken ct = default) =>
        _api.GetAsync<AttendancePageResponse>("/api/attendance/page", Query("deptCode", deptCode.ToString(), "date", AttendanceFormatHelper.ToApiDate(date)), ct);

    public Task<List<AttendanceStatusType>> GetStatusTypesAsync(CancellationToken ct = default) =>
        _api.GetAsync<List<AttendanceStatusType>>("/api/attendance/status-types", null, ct);

    public Task<ManualAttendanceRangeResult> UpdateManualRangeAsync(
        ManualAttendanceRangeRequest request,
        CancellationToken ct = default) =>
        _api.PutAsync<ManualAttendanceRangeRequest, ManualAttendanceRangeResult>("/api/attendance/manual-range", request, null, ct);

    public Task<StaffAttendanceRow> UpdateAttendanceAsync(
        UpdateAttendanceRequest request,
        DateOnly date,
        CancellationToken ct = default) =>
        _api.PutAsync<UpdateAttendanceRequest, StaffAttendanceRow>(
            "/api/attendance",
            request,
            Query("date", AttendanceFormatHelper.ToApiDate(date)),
            ct);

    public Task UnlockDepartmentAsync(int deptCode, string reason, DateOnly date, CancellationToken ct = default)
    {
        var body = new { deptCode, reason, date = AttendanceFormatHelper.ToApiDate(date) };
        return _api.PostAsync<object, ApiMessageResult>("/api/attendance/unlock", body, null, ct);
    }

    public Task<ApiMessageResult> RelockDepartmentAsync(int deptCode, DateOnly date, CancellationToken ct = default) =>
        _api.DeleteAsync<ApiMessageResult>(
            $"/api/attendance/unlock/{deptCode}?date={AttendanceFormatHelper.ToApiDate(date)}",
            ct);

    public Task<ScanLogPageDto> GetScanLogsAsync(
        int empCode,
        DateOnly date,
        int page = 1,
        int pageSize = 20,
        CancellationToken ct = default) =>
        _api.GetAsync<ScanLogPageDto>(
            "/api/attendance/scan-logs",
            Query("empCode", empCode.ToString(), "date", AttendanceFormatHelper.ToApiDate(date), "page", page.ToString(), "pageSize", pageSize.ToString()),
            ct);

    public Task<ManualAttendanceRangeResult> AssignNghiTrucWizardAsync(
        NghiTrucAssignRequest request,
        CancellationToken ct = default) =>
        _api.PutAsync<NghiTrucAssignRequest, ManualAttendanceRangeResult>(
            "/api/attendance/nghi-truc-assign",
            request,
            null,
            ct);

    public Task<ManualScheduleDto> GetManualScheduleAsync(
        int empCode,
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default) =>
        _api.GetAsync<ManualScheduleDto>(
            "/api/attendance/manual-schedule",
            Query(
                "empCode", empCode.ToString(),
                "from", AttendanceFormatHelper.ToApiDate(from),
                "to", AttendanceFormatHelper.ToApiDate(to)),
            ct);

    public Task<AttendanceStatisticsResponse> GetStatisticsAsync(
        int deptCode,
        DateOnly from,
        DateOnly to,
        string? search = null,
        CancellationToken ct = default) =>
        _api.GetAsync<AttendanceStatisticsResponse>(
            "/api/attendance/statistics",
            Query(
                "deptCode", deptCode.ToString(),
                "from", AttendanceFormatHelper.ToApiDate(from),
                "to", AttendanceFormatHelper.ToApiDate(to),
                "search", string.IsNullOrWhiteSpace(search) ? null : search.Trim()),
            ct);

    public Task<AttendanceHistoryPageResponse> GetStatisticsHistoryAsync(
        int deptCode,
        DateOnly from,
        DateOnly to,
        string? search,
        int page,
        int pageSize,
        CancellationToken ct = default) =>
        _api.GetAsync<AttendanceHistoryPageResponse>(
            "/api/attendance/statistics/history",
            Query(
                "deptCode", deptCode.ToString(),
                "from", AttendanceFormatHelper.ToApiDate(from),
                "to", AttendanceFormatHelper.ToApiDate(to),
                "search", string.IsNullOrWhiteSpace(search) ? null : search.Trim(),
                "page", page.ToString(),
                "pageSize", pageSize.ToString()),
            ct);

    public Task<List<AttendanceHistoryItem>> ExportStatisticsHistoryAsync(
        int deptCode,
        DateOnly from,
        DateOnly to,
        string? search = null,
        CancellationToken ct = default) =>
        _api.GetAsync<List<AttendanceHistoryItem>>(
            "/api/attendance/statistics/history/export",
            Query(
                "deptCode", deptCode.ToString(),
                "from", AttendanceFormatHelper.ToApiDate(from),
                "to", AttendanceFormatHelper.ToApiDate(to),
                "search", string.IsNullOrWhiteSpace(search) ? null : search.Trim()),
            ct);

    private static IEnumerable<KeyValuePair<string, string?>> Query(params string?[] pairs)
    {
        for (var i = 0; i + 1 < pairs.Length; i += 2)
        {
            yield return new KeyValuePair<string, string?>(pairs[i]!, pairs[i + 1]);
        }
    }
}
