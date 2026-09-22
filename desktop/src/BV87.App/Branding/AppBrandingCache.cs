using System.IO;
using System.Text.Json;
using BV87.Core.Models.Admin;

namespace BV87.App.Branding;

/// <summary>Persist last-known branding for offline login — stores data URLs from API.</summary>
internal static class AppBrandingCache
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = false
    };

    private static string CachePath =>
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "BV87",
            "branding-cache.json");

    public static AppBrandingState? TryLoad()
    {
        try
        {
            if (!File.Exists(CachePath))
            {
                return null;
            }

            var json = File.ReadAllText(CachePath);
            var dto = JsonSerializer.Deserialize<BrandingDto>(json, JsonOptions);
            return dto == null ? null : AppBrandingState.FromDto(dto);
        }
        catch
        {
            return null;
        }
    }

    public static void Save(AppBrandingState state)
    {
        try
        {
            var dir = Path.GetDirectoryName(CachePath)!;
            Directory.CreateDirectory(dir);
            var dto = new BrandingDto
            {
                PortalTitle = state.PortalTitle,
                PortalSubtitle = state.PortalSubtitle,
                LogoUrl = state.LogoUrl,
                LoginAvatarUrl = state.LoginAvatarUrl
            };
            File.WriteAllText(CachePath, JsonSerializer.Serialize(dto, JsonOptions));
        }
        catch
        {
            // cache is best-effort
        }
    }
}
