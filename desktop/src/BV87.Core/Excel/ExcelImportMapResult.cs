namespace BV87.Core.Excel;

public sealed class ExcelImportRow<TPayload>
{
    public int RowNumber { get; init; }
    public required TPayload Payload { get; init; }
}

public sealed class ExcelImportMapResult<TPayload>
{
    public required IReadOnlyList<ExcelImportRow<TPayload>> Payloads { get; init; }
    public required IReadOnlyList<string> Errors { get; init; }
}

public sealed class ExcelImportRunResult
{
    public string? StatusMessage { get; init; }
    public string? ErrorMessage { get; init; }
    public bool ShouldReload { get; init; }
    /// <summary>Partial import or empty file — SPEC D-UI.17 Warning toast.</summary>
    public bool IsWarning { get; init; }
}
