namespace BV87.App.Toasts;

/// <summary>Payload shown by <see cref="ToastHost"/>.</summary>
public sealed class ToastRequest
{
    public required ToastTone Tone { get; init; }
    public required string Message { get; init; }
}
