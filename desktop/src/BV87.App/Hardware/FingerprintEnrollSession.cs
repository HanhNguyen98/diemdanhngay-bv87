namespace BV87.App.Hardware;

/// <summary>Progress events posted to UI after SdkThread processing (parity ZKFPDemo).</summary>
public enum FingerprintEnrollEventKind
{
    SameFingerRejected,
    SampleAccepted,
    MergeFailed
}

/// <summary>One enroll event marshaled to UI — SdkThread never calls handler directly.</summary>
public sealed class FingerprintEnrollEvent
{
    public FingerprintEnrollEventKind Kind { get; init; }
    public int CompletedScans { get; init; }
    public FingerprintCapturePayload? Capture { get; init; }
    public string? ErrorMessage { get; init; }
}

/// <summary>Result after 3-sample merge or early exit.</summary>
public sealed class FingerprintEnrollSessionResult
{
    public bool Cancelled { get; init; }
    public int SampleCount { get; init; }
    public string? MergedBase64 { get; init; }
    public int MergedLength { get; init; }
    public string? ErrorMessage { get; init; }
}
