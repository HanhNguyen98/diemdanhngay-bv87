using System.Globalization;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.Core.Excel;

public sealed class DepartmentImportPayload
{
    public int GroupCode { get; init; }
    public required string DeptName { get; init; }
    public int? HeadEmpCode { get; init; }
}

public sealed class DepartmentExcelImportContext
{
    public required IReadOnlyList<AdminDepartmentGroupDto> Groups { get; init; }
    public required IReadOnlyList<AdminStaffDto> StaffList { get; init; }
}

/// <summary>Maps Excel rows to department create payloads — mirror mapDepartmentImportRows.</summary>
public static class DepartmentExcelImportMapper
{
    private static readonly CompareInfo VietnameseCompare = CultureInfo.GetCultureInfo("vi-VN").CompareInfo;

    public static ExcelImportMapResult<DepartmentImportPayload> MapRows(
        IReadOnlyList<IReadOnlyDictionary<string, string>> rows,
        DepartmentExcelImportContext context)
    {
        var payloads = new List<ExcelImportRow<DepartmentImportPayload>>();
        var errors = new List<string>();

        for (var index = 0; index < rows.Count; index++)
        {
            var rowNumber = index + 2;
            var row = rows[index];

            try
            {
                var groupName = GetRequired(row, ExcelImportHeaders.Department.GroupName, rowNumber);
                var group = context.Groups.FirstOrDefault(g =>
                    VietnameseCompare.Compare(g.GroupName ?? string.Empty, groupName, CompareOptions.IgnoreCase) == 0);

                if (group == null)
                {
                    throw new InvalidOperationException($"Dòng {rowNumber}: Không tìm thấy nhóm \"{groupName}\"");
                }

                var deptName = GetRequired(row, ExcelImportHeaders.Department.DeptName, rowNumber);
                row.TryGetValue(ExcelImportHeaders.Department.HeadName, out var headNameRaw);

                payloads.Add(new ExcelImportRow<DepartmentImportPayload>
                {
                    RowNumber = rowNumber,
                    Payload = new DepartmentImportPayload
                    {
                        GroupCode = group.GroupCode,
                        DeptName = deptName,
                        HeadEmpCode = ParseOptionalHeadEmpCode(headNameRaw, context.StaffList, rowNumber)
                    }
                });
            }
            catch (Exception ex)
            {
                errors.Add(ex.Message);
            }
        }

        return new ExcelImportMapResult<DepartmentImportPayload>
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

    private static int? ParseOptionalHeadEmpCode(
        string? value,
        IReadOnlyList<AdminStaffDto> staffList,
        int rowNumber)
    {
        var raw = (value ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(raw))
        {
            return null;
        }

        var match = staffList.FirstOrDefault(staff =>
            string.Equals(staff.Fullname?.Trim(), raw, StringComparison.OrdinalIgnoreCase));

        if (match == null)
        {
            throw new InvalidOperationException(
                $"Dòng {rowNumber}: không tìm thấy {ExcelImportHeaders.Department.HeadName} \"{raw}\"");
        }

        return match.EmpCode;
    }
}
