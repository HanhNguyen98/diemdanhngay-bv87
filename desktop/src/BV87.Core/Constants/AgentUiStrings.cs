namespace BV87.Core.Constants;

/// <summary>Vietnamese UI strings for WPF kiosk agent (SPEC §2.22).</summary>
public static class AgentUiStrings
{
    public const string WindowTitle = "BV87 — Chấm công vân tay";

    public const string WaitingForFinger = "Chờ đặt ngón tay…";

    public const string ConnectSystemOk = "Kết nối hệ thống OK. Đơn vị {0}.";

    public const string ConnectSystemOkNeedDevice = "Kết nối hệ thống OK. Đơn vị {0}. Kết nối thiết bị để Chấm công.";

    public const string MissingKioskToken = "Thiếu kioskToken trong agent.config.json cạnh BV87.exe.";

    public const string AgentAlreadyRunning = "Agent chấm công đang chạy trên máy này. Không mở thêm cửa sổ quét.";

    public const string TemplatesLoaded = "Đã nạp {0}/{1} mẫu toàn viện. Chờ đặt ngón tay…";

    public const string TemplatesLoadedPartial = "Đã nạp {0}/{1} mẫu toàn viện (thiếu {2}). Chờ đặt ngón tay…";

    public const string TemplatesEmpty = "Chưa có mẫu vân tay toàn viện. Liên hệ quản trị để đăng ký.";

    public const string IdentifyFailed = "Không nhận diện được. Thử lại hoặc đăng ký lại vân tay.";

    public const string IdentifyUnmapped = "Nhận diện được nhưng không khớp danh sách. Tải lại mẫu hoặc đăng ký lại.";

    public const string ScanInFlight = "Đang xử lý quét trước — chờ giây lát.";

    public static string ScanDebounced(string fullname) =>
        $"Vừa ghi nhận {fullname} — chờ giây lát rồi quét lại.";

    public const string ScanApiError = "LỖI";

    public const string DeviceConnectSuccess = "Đã kết nối ZK9500.";

    public static string DeviceConnectRetry(int attempt, int max) =>
        $"Chưa mở được ZK9500 — thử lại ({attempt}/{max})…";

    public const string DeviceConnectFail = "Không mở được ZK9500. Kiểm tra cáp USB.";

    public const string DeviceDisconnected = "Thiết bị ngắt kết nối. Đang chờ cắm lại USB…";

    public const string TemplateReloadFailed = "Không tải được mẫu vân tay";

    public const string BootstrapFailed = "Lỗi kết nối hệ thống";

    public const string DeptLabelPrefix = "Đơn vị:";

    public const string TemplateCountLabel = "Mẫu đã nạp:";

    public const string DeviceStatusLabel = "Thiết bị:";

    public const string DeviceStatusConnected = "Đã kết nối";

    public const string DeviceStatusDisconnected = "Chưa kết nối";

    public const string DeviceStatusPausedEnroll = "Tạm dừng (đăng ký vân tay)";

    public const string UsbPausedForEnroll = "Tạm dừng quét — trưởng đơn vị đang đăng ký vân tay. Đặt ngón sau khi hết đăng ký.";

    public const string UsbResumedAfterEnroll = "Đã kết nối lại máy quét. Chờ đặt ngón tay…";

    public const string KioskLabelPrefix = "Kiosk:";
}
