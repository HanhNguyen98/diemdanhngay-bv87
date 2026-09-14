namespace BV87.Core.Helpers;

/// <summary>Read image files as data URLs for branding API — parity Web avatarUpload.js.</summary>
public static class ImageDataUrlHelper
{
    public const long MaxBytes = 5 * 1024 * 1024;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
    };

    private static readonly Dictionary<string, string> MimeByExtension = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".gif"] = "image/gif",
        [".webp"] = "image/webp"
    };

    public static string? ValidateFile(string filePath)
    {
        if (string.IsNullOrWhiteSpace(filePath) || !File.Exists(filePath))
        {
            return Constants.SettingsUiStrings.System.ImageReadError;
        }

        var ext = Path.GetExtension(filePath);
        if (!AllowedExtensions.Contains(ext))
        {
            return Constants.SettingsUiStrings.System.ImageTypeError;
        }

        var info = new FileInfo(filePath);
        if (info.Length <= 0 || info.Length > MaxBytes)
        {
            return Constants.SettingsUiStrings.System.ImageSizeError;
        }

        return null;
    }

    public static async Task<string> ReadAsDataUrlAsync(string filePath, CancellationToken cancellationToken = default)
    {
        var validationError = ValidateFile(filePath);
        if (validationError != null)
        {
            throw new InvalidOperationException(validationError);
        }

        var ext = Path.GetExtension(filePath);
        if (!MimeByExtension.TryGetValue(ext, out var mime))
        {
            throw new InvalidOperationException(Constants.SettingsUiStrings.System.ImageTypeError);
        }

        var bytes = await File.ReadAllBytesAsync(filePath, cancellationToken);
        var base64 = Convert.ToBase64String(bytes);
        return $"data:{mime};base64,{base64}";
    }
}
