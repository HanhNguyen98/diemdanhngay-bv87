namespace BV87.Core.Excel;

public sealed class ExcelRegistryConfig
{
    public required string TemplateFilename { get; init; }
    public required string ExportFilename { get; init; }
    public required string SheetName { get; init; }
    public required IReadOnlyList<string> TemplateHeaders { get; init; }
    public required IReadOnlyList<object> TemplateSampleRow { get; init; }
    public required IReadOnlyList<string> ExportHeaders { get; init; }
}
