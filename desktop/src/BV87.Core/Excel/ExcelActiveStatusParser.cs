namespace BV87.Core.Excel;

/// <summary>Parses active/inactive values from Excel import cells — mirror excelImport.js parseActiveStatus.</summary>
public static class ExcelActiveStatusParser
{
    private static readonly HashSet<string> ActiveValues = new(StringComparer.OrdinalIgnoreCase)
    {
        "đang hoạt động",
        "dang hoat dong",
        "đang sử dụng",
        "dang su dung",
        "hoat dong",
        "active",
        "1",
        "true",
        "có",
        "co"
    };

    private static readonly HashSet<string> InactiveValues = new(StringComparer.OrdinalIgnoreCase)
    {
        "ngưng hoạt động",
        "ngung hoat dong",
        "ngưng sử dụng",
        "ngung su dung",
        "inactive",
        "0",
        "false",
        "không",
        "khong"
    };

    public static bool Parse(string? value)
    {
        var normalized = (value ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(normalized))
        {
            return true;
        }

        if (ActiveValues.Contains(normalized))
        {
            return true;
        }

        if (InactiveValues.Contains(normalized))
        {
            return false;
        }

        throw new InvalidOperationException($"Trạng thái không hợp lệ: \"{value}\"");
    }
}
