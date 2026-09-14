namespace BV87.App.Toasts;

/// <summary>App-wide toast publisher — overlay on <c>MainShellWindow</c> (SPEC D-ATT.2).</summary>
public sealed class ToastService
{
    public event EventHandler<ToastRequest>? Shown;

    public void ShowSuccess(string message) => Raise(ToastTone.Success, message);

    public void ShowWarning(string message) => Raise(ToastTone.Warning, message);

    public void ShowDanger(string message) => Raise(ToastTone.Danger, message);

    private void Raise(ToastTone tone, string message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return;
        }

        Shown?.Invoke(this, new ToastRequest { Tone = tone, Message = message.Trim() });
    }
}
