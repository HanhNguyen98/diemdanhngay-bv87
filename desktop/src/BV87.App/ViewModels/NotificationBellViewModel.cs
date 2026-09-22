using System.Collections.ObjectModel;
using System.Windows.Input;
using System.Windows.Threading;
using BV87.App;
using BV87.App.Helpers;
using BV87.Core.Api;
using BV87.Core.Constants;
using BV87.Core.Models;

namespace BV87.App.ViewModels;

public sealed class NotificationNavigationRequest
{
    public required string TargetNavId { get; init; }
    public DateOnly? AttendanceDate { get; init; }
    public int? DeptCode { get; init; }
}

public sealed class NotificationItemViewModel
{
    public NotificationItemViewModel(NotificationItem item)
    {
        Id = item.Id;
        Type = item.Type ?? string.Empty;
        Title = item.Title;
        Body = item.Body ?? string.Empty;
        IsRead = item.Read;
        AttendanceDate = item.AttendanceDate;
        DeptCode = item.DeptCode;
        CreatedAtText = AdminUtilitiesFormatHelper.FormatLogDateTime(item.CreatedAt);
    }

    public long Id { get; }
    public string Type { get; }
    public string Title { get; }
    public string Body { get; }
    public bool IsRead { get; }
    public DateOnly? AttendanceDate { get; }
    public int? DeptCode { get; }
    public string CreatedAtText { get; }
}

public sealed class NotificationBellViewModel : ViewModelBase
{
    private const int PollIntervalMs = 60_000;

    private readonly NotificationApiClient _notificationApi;
    private readonly DispatcherTimer _pollTimer;
    private bool _isOpen;
    private bool _isLoading;
    private long _unreadCount;

    public NotificationBellViewModel(NotificationApiClient notificationApi)
    {
        _notificationApi = notificationApi;
        Items = new ObservableCollection<NotificationItemViewModel>();

        ToggleCommand = new RelayCommand(ToggleOpen);
        ItemClickCommand = new RelayCommand<NotificationItemViewModel>(async item =>
        {
            if (item != null)
            {
                await HandleItemClickAsync(item);
            }
        });

        _pollTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(PollIntervalMs) };
        _pollTimer.Tick += async (_, _) => await RefreshAsync(silent: true);

        _ = RefreshAsync(silent: true);
        _pollTimer.Start();
    }

    public ObservableCollection<NotificationItemViewModel> Items { get; }

    public ICommand ToggleCommand { get; }
    public ICommand ItemClickCommand { get; }

    public event EventHandler<NotificationNavigationRequest>? NavigationRequested;

    public string PanelTitle => NotificationUiStrings.PanelTitle;
    public string LoadingMessage => NotificationUiStrings.Loading;
    public string EmptyMessage => NotificationUiStrings.Empty;

    public bool IsOpen
    {
        get => _isOpen;
        set => SetProperty(ref _isOpen, value);
    }

    public bool IsLoading
    {
        get => _isLoading;
        private set => SetProperty(ref _isLoading, value);
    }

    public long UnreadCount => _unreadCount;

    public string UnreadBadgeText => _unreadCount > 99 ? "99+" : _unreadCount.ToString();

    public bool ShowUnreadBadge => _unreadCount > 0;

    public bool ShowEmpty => !IsLoading && Items.Count == 0;

    public void Close() => IsOpen = false;

    private void ToggleOpen()
    {
        IsOpen = !IsOpen;
        if (IsOpen)
        {
            _ = RefreshAsync(silent: Items.Count > 0);
        }
    }

    private async Task RefreshAsync(bool silent)
    {
        if (!silent)
        {
            IsLoading = true;
        }

        try
        {
            var listTask = _notificationApi.ListAsync();
            var countTask = _notificationApi.GetUnreadCountAsync();
            await Task.WhenAll(listTask, countTask);

            Items.Clear();
            foreach (var item in listTask.Result)
            {
                Items.Add(new NotificationItemViewModel(item));
            }

            _unreadCount = countTask.Result.Count;
            OnPropertyChanged(nameof(UnreadCount));
            OnPropertyChanged(nameof(UnreadBadgeText));
            OnPropertyChanged(nameof(ShowUnreadBadge));
            OnPropertyChanged(nameof(ShowEmpty));
        }
        catch
        {
            // Poll errors should not block shell — parity Web ignore poll errors.
        }
        finally
        {
            IsLoading = false;
        }
    }

    private async Task HandleItemClickAsync(NotificationItemViewModel item)
    {
        try
        {
            if (!item.IsRead)
            {
                await _notificationApi.MarkReadAsync(item.Id);
            }

            IsOpen = false;
            await RefreshAsync(silent: true);

            switch (item.Type)
            {
                case NotificationTypes.AttendanceReminder:
                case NotificationTypes.UnlockRequestResult:
                    if (item.AttendanceDate != null)
                    {
                        NavigationRequested?.Invoke(this, new NotificationNavigationRequest
                        {
                            TargetNavId = "attendance",
                            AttendanceDate = item.AttendanceDate
                        });
                    }
                    break;
                case NotificationTypes.UnlockRequest:
                    var hasUnlockQueue = App.Sessions.Session.User?.ScreenCodes?
                        .Contains("admin.unlock-requests", StringComparer.OrdinalIgnoreCase) == true;
                    NavigationRequested?.Invoke(this, new NotificationNavigationRequest
                    {
                        TargetNavId = App.Sessions.Session.User?.IsDuty == true && !hasUnlockQueue
                            ? "dashboard-dept"
                            : "unlock-requests",
                        AttendanceDate = item.AttendanceDate,
                        DeptCode = item.DeptCode
                    });
                    break;
            }
        }
        catch
        {
            // Keep UI responsive on mark-read failure.
        }
    }
}
