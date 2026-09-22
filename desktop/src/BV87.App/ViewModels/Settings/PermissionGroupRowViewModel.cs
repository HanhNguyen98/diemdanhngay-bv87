using BV87.Core.Helpers;
using BV87.Core.Models.Admin;

namespace BV87.App.ViewModels.Settings;

public sealed class PermissionGroupRowViewModel : IPageRowNumber
{
    private PermissionGroupRowViewModel(PermissionGroupDto dto)
    {
        Dto = dto;
    }

    public PermissionGroupDto Dto { get; }

    public int RowNumber { get; set; }
    public long Id => Dto.Id;
    public string Name => string.IsNullOrWhiteSpace(Dto.Name) ? "—" : Dto.Name;
    public string RoleLabel => Dto.RoleScopeLabel ?? Dto.RoleScope ?? "—";
    public int ScreenCount => Dto.ScreenCodes?.Count ?? 0;
    public long AccountCount => Dto.AccountCount;
    public bool Active => Dto.Active;
    public string StatusLabel => Active
        ? Core.Constants.SettingsUiStrings.PermissionGroups.Active
        : Core.Constants.SettingsUiStrings.PermissionGroups.Inactive;

    public static PermissionGroupRowViewModel FromDto(PermissionGroupDto dto) => new(dto);
}
