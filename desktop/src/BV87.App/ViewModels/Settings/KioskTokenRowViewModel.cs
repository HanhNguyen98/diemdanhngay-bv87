using BV87.Core.Helpers;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels.Settings;

public sealed class KioskTokenRowViewModel : IPageRowNumber
{
    private KioskTokenRowViewModel(KioskTokenDto dto, string createdAtText, string tokenDisplay,
        string statusLabel, string agentLabel, bool agentOnline)
    {
        Dto = dto;
        CreatedAtText = createdAtText;
        TokenDisplay = tokenDisplay;
        StatusLabel = statusLabel;
        AgentLabel = agentLabel;
        AgentOnline = agentOnline;
    }

    public KioskTokenDto Dto { get; }
    public int RowNumber { get; set; }
    public long Id => Dto.Id;
    public string DeptDisplay => DeptDisplayFormatter.Format(
        Dto.UnitCode,
        Dto.DeptName,
        Dto.DeptCodeFormatted ?? Dto.DeptCode.ToString("D2"));
    public string LabelDisplay => string.IsNullOrWhiteSpace(Dto.Label) ? "—" : Dto.Label;
    public string TokenDisplay { get; }
    public string CreatedAtText { get; }
    public string StatusLabel { get; }
    public string AgentLabel { get; }
    public bool Active => Dto.Active;
    public bool AgentOnline { get; }
    public bool HasCopyableToken => Active && !string.IsNullOrWhiteSpace(Dto.Token);

    public static KioskTokenRowViewModel FromDto(KioskTokenDto dto, Func<DateTime?, string> formatDateTime)
    {
        var tokenDisplay = dto.Active && !string.IsNullOrWhiteSpace(dto.Token)
            ? dto.Token!
            : Core.Constants.SettingsUiStrings.KioskTokens.TokenMissing;
        var status = dto.Active
            ? Core.Constants.SettingsUiStrings.KioskTokens.StatusActive
            : Core.Constants.SettingsUiStrings.KioskTokens.StatusRevoked;
        var agent = dto.Active
            ? (dto.AgentOnline
                ? Core.Constants.SettingsUiStrings.KioskTokens.AgentOnline
                : Core.Constants.SettingsUiStrings.KioskTokens.AgentOffline)
            : "—";

        return new KioskTokenRowViewModel(
            dto,
            formatDateTime(dto.CreatedAt),
            tokenDisplay,
            status,
            agent,
            dto.AgentOnline);
    }
}

public sealed class KioskTokenFilterOption(string? value, string label)
{
    public string? Value { get; } = value;
    public string Label { get; } = label;
}
