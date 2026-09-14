namespace BV87.App.Hardware;

/// <summary>One SDK capture: 2048-byte template plus grayscale image snapshot.</summary>
public sealed class FingerprintCapturePayload
{
    public required byte[] Template { get; init; }

    public int TemplateLength { get; init; }

    public required byte[] Image { get; init; }

    public int ImageWidth { get; init; }

    public int ImageHeight { get; init; }
}
