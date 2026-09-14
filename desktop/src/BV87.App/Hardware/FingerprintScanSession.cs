namespace BV87.App.Hardware;

public enum FingerprintScanEventKind
{
    Preview,
    IdentifyFailed,
    IdentifyUnmapped,
    IdentifyMatched
}

public sealed class FingerprintScanEvent
{
    public FingerprintScanEventKind Kind { get; init; }

    public FingerprintCapturePayload? Capture { get; init; }

    public int EmpCode { get; init; }

    public string? Fullname { get; init; }

    public int Score { get; init; }

    public int Fid { get; init; }
}

public sealed class IdentifyTemplateLoadResult
{
    public int Total { get; init; }

    public int Loaded { get; init; }

    public int Skipped { get; init; }
}
