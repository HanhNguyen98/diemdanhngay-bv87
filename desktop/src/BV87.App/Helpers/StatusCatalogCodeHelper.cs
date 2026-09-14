using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace BV87.App.Helpers;

public static partial class StatusCatalogCodeHelper
{
    public static string SlugifyCode(string label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return string.Empty;
        }

        var normalized = label.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        foreach (var ch in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(ch);
            if (category != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(ch);
            }
        }

        var text = builder.ToString()
            .Replace('đ', 'd')
            .Replace('Đ', 'D')
            .Trim()
            .ToUpperInvariant();

        text = NonAlphaNumericRegex().Replace(text, "_");
        text = TrimUnderscoreRegex().Replace(text, string.Empty);
        return text.Length <= 50 ? text : text[..50];
    }

    [GeneratedRegex(@"[^A-Z0-9]+")]
    private static partial Regex NonAlphaNumericRegex();

    [GeneratedRegex("^_+|_+$")]
    private static partial Regex TrimUnderscoreRegex();
}
