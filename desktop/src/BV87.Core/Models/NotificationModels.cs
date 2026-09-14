namespace BV87.Core.Models;

public sealed class NotificationItem
{
    public long Id { get; set; }
    public string? Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public int? DeptCode { get; set; }
    public DateOnly? AttendanceDate { get; set; }
    public bool Read { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public sealed class NotificationUnreadCountResponse
{
    public long Count { get; set; }
}

public static class NotificationTypes
{
    public const string AttendanceReminder = "ATTENDANCE_REMINDER";
    public const string AdminReminderResult = "ADMIN_REMINDER_RESULT";
    public const string UnlockRequest = "UNLOCK_REQUEST";
    public const string UnlockRequestResult = "UNLOCK_REQUEST_RESULT";
}
