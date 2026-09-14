using ClosedXML.Excel;

namespace BV87.Core.Excel;

/// <summary>Read/write Excel workbooks for admin catalog import/export — mirror exportExcel.js.</summary>
public sealed class ExcelFileService
{
    private const string HeaderFillColor = "#DCE6F1";

    public void WriteTemplate(ExcelRegistryConfig config, string filePath)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add(config.SheetName);

        WriteHeaderRow(worksheet, config.TemplateHeaders, styled: true);

        if (config.TemplateSampleRow.Count > 0)
        {
            for (var col = 0; col < config.TemplateSampleRow.Count; col++)
            {
                worksheet.Cell(2, col + 1).Value = XLCellValue.FromObject(config.TemplateSampleRow[col]);
            }

            ApplyBodyStyle(worksheet, 2, config.TemplateSampleRow.Count);
        }

        AutoFitColumns(worksheet, config.TemplateHeaders.Count, config.TemplateSampleRow.Count > 0 ? 2 : 1);
        workbook.SaveAs(filePath);
    }

    public void WriteExport(
        ExcelRegistryConfig config,
        IReadOnlyList<IReadOnlyList<object>> rows,
        string filePath)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add(config.SheetName);

        WriteHeaderRow(worksheet, config.ExportHeaders, styled: false);

        for (var rowIndex = 0; rowIndex < rows.Count; rowIndex++)
        {
            var row = rows[rowIndex];
            for (var col = 0; col < row.Count; col++)
            {
                worksheet.Cell(rowIndex + 2, col + 1).Value = XLCellValue.FromObject(row[col]);
            }
        }

        AutoFitColumns(worksheet, config.ExportHeaders.Count, rows.Count + 1);
        workbook.SaveAs(filePath);
    }

    public IReadOnlyList<Dictionary<string, string>> ReadRows(string filePath, IReadOnlyList<string> expectedHeaders)
    {
        using var workbook = new XLWorkbook(filePath);
        var worksheet = workbook.Worksheet(1);

        var lastRow = worksheet.LastRowUsed()?.RowNumber() ?? 0;
        var lastCol = worksheet.LastColumnUsed()?.ColumnNumber() ?? 0;

        if (lastRow == 0 || lastCol == 0)
        {
            throw new ExcelReadException(ExcelReadErrorKind.EmptyFile);
        }

        var fileHeaders = new List<string>(lastCol);
        for (var col = 1; col <= lastCol; col++)
        {
            fileHeaders.Add(worksheet.Cell(1, col).GetString().Trim());
        }

        if (!HeadersMatch(fileHeaders, expectedHeaders))
        {
            throw new ExcelReadException(ExcelReadErrorKind.InvalidTemplate);
        }

        var results = new List<Dictionary<string, string>>();

        for (var row = 2; row <= lastRow; row++)
        {
            var cells = new string[lastCol];
            var hasData = false;

            for (var col = 1; col <= lastCol; col++)
            {
                var cellValue = worksheet.Cell(row, col).GetFormattedString().Trim();
                cells[col - 1] = cellValue;
                if (!string.IsNullOrEmpty(cellValue))
                {
                    hasData = true;
                }
            }

            if (!hasData)
            {
                continue;
            }

            var record = new Dictionary<string, string>(StringComparer.Ordinal);
            for (var col = 0; col < expectedHeaders.Count; col++)
            {
                record[expectedHeaders[col]] = col < cells.Length ? cells[col] : string.Empty;
            }

            results.Add(record);
        }

        return results;
    }

    private static bool HeadersMatch(IReadOnlyList<string> fileHeaders, IReadOnlyList<string> expectedHeaders)
    {
        if (fileHeaders.Count != expectedHeaders.Count)
        {
            return false;
        }

        for (var i = 0; i < expectedHeaders.Count; i++)
        {
            if (!string.Equals(NormalizeHeader(fileHeaders[i]), NormalizeHeader(expectedHeaders[i]), StringComparison.Ordinal))
            {
                return false;
            }
        }

        return true;
    }

    private static string NormalizeHeader(string value) =>
        value.Trim().ToLowerInvariant();

    private static void WriteHeaderRow(IXLWorksheet worksheet, IReadOnlyList<string> headers, bool styled)
    {
        for (var col = 0; col < headers.Count; col++)
        {
            var cell = worksheet.Cell(1, col + 1);
            cell.Value = headers[col];

            if (styled)
            {
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontName = "Times New Roman";
                cell.Style.Font.FontSize = 11;
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml(HeaderFillColor);
                cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
                cell.Style.Alignment.WrapText = true;
            }
        }
    }

    private static void ApplyBodyStyle(IXLWorksheet worksheet, int rowNumber, int columnCount)
    {
        for (var col = 1; col <= columnCount; col++)
        {
            var cell = worksheet.Cell(rowNumber, col);
            cell.Style.Font.FontName = "Times New Roman";
            cell.Style.Font.FontSize = 11;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            cell.Style.Alignment.WrapText = true;
        }
    }

    private static void AutoFitColumns(IXLWorksheet worksheet, int columnCount, int rowCount)
    {
        for (var col = 1; col <= columnCount; col++)
        {
            worksheet.Column(col).AdjustToContents(1, rowCount);
            if (worksheet.Column(col).Width > 60)
            {
                worksheet.Column(col).Width = 60;
            }
        }
    }
}
