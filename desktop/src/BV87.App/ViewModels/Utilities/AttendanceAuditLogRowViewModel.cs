using BV87.App.Helpers;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels.Utilities;

public sealed class AttendanceAuditLogRowViewModel : IPageRowNumber
{
    public AttendanceAuditLogRowViewModel(AttendanceAuditLogItemDto dto)
    {
        CreatedAtText = AdminUtilitiesFormatHelper.FormatLogDateTimeOrDash(dto.CreatedAt);
        Username = string.IsNullOrWhiteSpace(dto.Username) ? "—" : dto.Username!;
        DeptCodeText = DeptDisplayFormatter.Format(dto.UnitCode, dto.DeptName, dto.DeptCodeFormatted);
        EmpCodeText = string.IsNullOrWhiteSpace(dto.EmpCodeFormatted) ? "—" : dto.EmpCodeFormatted!;
        AttendanceDateText = AdminUtilitiesFormatHelper.FormatDateOnly(dto.AttendanceDate);
        ActionLabel = string.IsNullOrWhiteSpace(dto.ActionLabel)
            ? (string.IsNullOrWhiteSpace(dto.Action) ? "—" : dto.Action!)
            : dto.ActionLabel!;
        IpText = AdminUtilitiesFormatHelper.DisplayIpOrDash(dto.ClientIp);
    }

    public string CreatedAtText { get; }
    public int RowNumber { get; set; }
    public string Username { get; }
    public string DeptCodeText { get; }
    public string EmpCodeText { get; }
    public string AttendanceDateText { get; }
    public string ActionLabel { get; }
    public string IpText { get; }
}
