namespace BV87.Core.Excel;

public enum ExcelReadErrorKind
{
    EmptyFile,
    InvalidTemplate
}

public sealed class ExcelReadException : Exception
{
    public ExcelReadException(ExcelReadErrorKind kind)
        : base(kind.ToString())
    {
        Kind = kind;
    }

    public ExcelReadErrorKind Kind { get; }
}
