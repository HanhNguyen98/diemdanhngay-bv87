using BV87.Core.Constants;

namespace BV87.Core.Excel;

/// <summary>Shared Excel import orchestration — read, map, create-only row-by-row (§2.16).</summary>
public static class ExcelImportRunner
{
    public static async Task<ExcelImportRunResult> RunAsync<TPayload>(
        ExcelFileService excelFileService,
        string filePath,
        IReadOnlyList<string> templateHeaders,
        Func<IReadOnlyList<IReadOnlyDictionary<string, string>>, ExcelImportMapResult<TPayload>> mapRows,
        Func<TPayload, Task> createAsync,
        string itemUnit,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var rawRows = excelFileService.ReadRows(filePath, templateHeaders);
            if (rawRows.Count == 0)
            {
                return new ExcelImportRunResult
                {
                    StatusMessage = ExcelUiStrings.ImportEmpty,
                    IsWarning = true
                };
            }

            var mapped = mapRows(rawRows);
            if (mapped.Payloads.Count == 0)
            {
                return new ExcelImportRunResult
                {
                    ErrorMessage = mapped.Errors.FirstOrDefault() ?? ExcelUiStrings.ImportFail
                };
            }

            var createErrors = new List<string>();
            var successCount = 0;

            foreach (var row in mapped.Payloads)
            {
                cancellationToken.ThrowIfCancellationRequested();

                try
                {
                    await createAsync(row.Payload);
                    successCount++;
                }
                catch (Exception ex)
                {
                    createErrors.Add($"Dòng {row.RowNumber}: {ExtractMessage(ex)}");
                }
            }

            var allErrors = mapped.Errors.Concat(createErrors).ToList();

            if (successCount > 0 && allErrors.Count == 0)
            {
                return new ExcelImportRunResult
                {
                    StatusMessage = ExcelUiStrings.ImportSuccess(successCount, itemUnit),
                    ShouldReload = true
                };
            }

            if (successCount > 0)
            {
                return new ExcelImportRunResult
                {
                    StatusMessage = ExcelUiStrings.ImportPartial(successCount, allErrors.Count, itemUnit),
                    ShouldReload = true,
                    IsWarning = true
                };
            }

            return new ExcelImportRunResult
            {
                ErrorMessage = ExcelUiStrings.ImportFail
            };
        }
        catch (ExcelReadException ex) when (ex.Kind == ExcelReadErrorKind.InvalidTemplate)
        {
            return new ExcelImportRunResult
            {
                ErrorMessage = ExcelUiStrings.ImportInvalidFile
            };
        }
        catch (ExcelReadException ex) when (ex.Kind == ExcelReadErrorKind.EmptyFile)
        {
            return new ExcelImportRunResult
            {
                StatusMessage = ExcelUiStrings.ImportEmpty,
                IsWarning = true
            };
        }
    }

    private static string ExtractMessage(Exception ex) =>
        ex.Message.Trim('"', ' ');
}
