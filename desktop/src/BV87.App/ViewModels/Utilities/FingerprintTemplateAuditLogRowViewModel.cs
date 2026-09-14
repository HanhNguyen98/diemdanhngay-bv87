using BV87.App.Helpers;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels.Utilities;

public sealed class FingerprintTemplateAuditLogRowViewModel : IPageRowNumber
{
    public FingerprintTemplateAuditLogRowViewModel(FingerprintTemplateAuditLogItemDto dto)
    {
        CreatedAtText = AdminUtilitiesFormatHelper.FormatLogDateTimeOrDash(dto.CreatedAt);
        ActionLabel = dto.ActionLabel ?? dto.Action ?? "—";
        EmpDisplay = string.IsNullOrWhiteSpace(dto.EmpCodeFormatted)
            ? "—"
            : $"{dto.EmpCodeFormatted} — {dto.EmpFullname ?? "—"}";
        DeptCodeText = DeptDisplayFormatter.Format(dto.UnitCode, dto.DeptName, dto.DeptCodeFormatted);
        ActorText = FormatActor(dto.ActorUsername, dto.ActorRole, dto.KioskLabel);
        FingerLabel = string.IsNullOrWhiteSpace(dto.FingerLabel) ? "—" : dto.FingerLabel!;
        IpText = AdminUtilitiesFormatHelper.DisplayIpOrDash(dto.ClientIp);
    }

    public string CreatedAtText { get; }
    public int RowNumber { get; set; }
    public string ActionLabel { get; }
    public string EmpDisplay { get; }
    public string DeptCodeText { get; }
    public string ActorText { get; }
    public string FingerLabel { get; }
    public string IpText { get; }

    private static string FormatActor(string? username, string? role, string? kioskLabel)
    {
        if (!string.IsNullOrWhiteSpace(username))
        {
            return username;
        }

        if (!string.IsNullOrWhiteSpace(kioskLabel))
        {
            return kioskLabel;
        }

        return role ?? "—";
    }
}
