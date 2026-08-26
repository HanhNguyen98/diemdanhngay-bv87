namespace BV87.Core;

public sealed class ApiException : Exception
{
    public ApiException(string message) : base(message)
    {
    }
}
