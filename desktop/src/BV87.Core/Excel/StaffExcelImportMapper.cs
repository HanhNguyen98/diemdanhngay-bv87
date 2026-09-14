using BV87.Core.Models.Admin.Catalog;

namespace BV87.Core.Excel;

public sealed class StaffImportPayload
{
    public required string Fullname { get; init; }
    public int DeptCode { get; init; }
    public string? RankName { get; init; }
    public string? PositionName { get; init; }
    public bool Active { get; init; }
}

public sealed class StaffExcelImportContext
{
    public required IReadOnlyList<AdminDepartmentDto> Departments { get; init; }
    public required IReadOnlyList<string> RankNames { get; init; }
    public required IReadOnlyList<string> PositionNames { get; init; }
}

/// <summary>Maps Excel rows to staff create payloads — mirror mapStaffImportRows.</summary>
public static class StaffExcelImportMapper
{
    public static ExcelImportMapResult<StaffImportPayload> MapRows(
        IReadOnlyList<IReadOnlyDictionary<string, string>> rows,
        StaffExcelImportContext context)
    {
        var rankSet = new HashSet<string>(context.RankNames, StringComparer.Ordinal);
        var positionSet = new HashSet<string>(context.PositionNames, StringComparer.Ordinal);
        var validateCatalog = rankSet.Count > 0 || positionSet.Count > 0;

        var payloads = new List<ExcelImportRow<StaffImportPayload>>();
        var errors = new List<string>();

        for (var index = 0; index < rows.Count; index++)
        {
            var rowNumber = index + 2;
            var row = rows[index];

            try
            {
                var fullname = GetRequired(row, ExcelImportHeaders.Staff.Fullname, rowNumber);
                var deptCode = ParseDeptCode(row, context.Departments, rowNumber);

                row.TryGetValue(ExcelImportHeaders.Staff.Rank, out var rankRaw);
                row.TryGetValue(ExcelImportHeaders.Staff.Position, out var positionRaw);

                var rankName = string.IsNullOrWhiteSpace(rankRaw) ? null : rankRaw.Trim();
                var positionName = string.IsNullOrWhiteSpace(positionRaw) ? null : positionRaw.Trim();

                if (validateCatalog && rankName != null && rankSet.Count > 0 && !rankSet.Contains(rankName))
                {
                    throw new InvalidOperationException(
                        $"Dòng {rowNumber}: {ExcelImportHeaders.Staff.Rank} không hợp lệ \"{rankName}\"");
                }

                if (validateCatalog && positionName != null && positionSet.Count > 0 && !positionSet.Contains(positionName))
                {
                    throw new InvalidOperationException(
                        $"Dòng {rowNumber}: {ExcelImportHeaders.Staff.Position} không hợp lệ \"{positionName}\"");
                }

                row.TryGetValue(ExcelImportHeaders.Staff.Status, out var statusRaw);

                payloads.Add(new ExcelImportRow<StaffImportPayload>
                {
                    RowNumber = rowNumber,
                    Payload = new StaffImportPayload
                    {
                        Fullname = fullname,
                        DeptCode = deptCode,
                        RankName = rankName,
                        PositionName = positionName,
                        Active = ExcelActiveStatusParser.Parse(statusRaw)
                    }
                });
            }
            catch (Exception ex)
            {
                errors.Add(ex.Message);
            }
        }

        return new ExcelImportMapResult<StaffImportPayload>
        {
            Payloads = payloads,
            Errors = errors
        };
    }

    private static string GetRequired(IReadOnlyDictionary<string, string> row, string header, int rowNumber)
    {
        if (!row.TryGetValue(header, out var value))
        {
            throw new InvalidOperationException($"Dòng {rowNumber}: {header} là bắt buộc");
        }

        var trimmed = value.Trim();
        if (string.IsNullOrEmpty(trimmed))
        {
            throw new InvalidOperationException($"Dòng {rowNumber}: {header} là bắt buộc");
        }

        return trimmed;
    }

    private static int ParseDeptCode(
        IReadOnlyDictionary<string, string> row,
        IReadOnlyList<AdminDepartmentDto> departments,
        int rowNumber)
    {
        if (!row.TryGetValue(ExcelImportHeaders.Staff.DeptCode, out var rawValue))
        {
            throw new InvalidOperationException($"Dòng {rowNumber}: {ExcelImportHeaders.Staff.DeptCode} là bắt buộc");
        }

        var raw = rawValue.Trim();
        if (string.IsNullOrEmpty(raw))
        {
            throw new InvalidOperationException($"Dòng {rowNumber}: {ExcelImportHeaders.Staff.DeptCode} là bắt buộc");
        }

        if (!int.TryParse(raw, out var deptCode))
        {
            throw new InvalidOperationException($"Dòng {rowNumber}: {ExcelImportHeaders.Staff.DeptCode} không hợp lệ");
        }

        var exists = departments.Any(d => d.DeptCode == deptCode);
        if (!exists)
        {
            throw new InvalidOperationException(
                $"Dòng {rowNumber}: không tìm thấy {ExcelImportHeaders.Staff.DeptCode} \"{raw}\"");
        }

        return deptCode;
    }
}
