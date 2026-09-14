namespace BV87.Core.Constants;

/// <summary>Dropdown options for attendance status catalog form — parity frontend/constants/statusCatalog.js.</summary>
public static class StatusCatalogOptions
{
    public sealed record Option(string Value, string Label);

    public static IReadOnlyList<Option> ColorOptions { get; } =
    [
        new("green", "Xanh lá (Đi làm)"),
        new("red", "Đỏ (Nghỉ phép)"),
        new("yellow", "Vàng (Đi học)"),
        new("blue", "Xanh dương (Công tác)"),
        new("teal", "Xanh ngọc"),
        new("amber", "Cam"),
        new("purple", "Tím"),
        new("pink", "Hồng"),
        new("brown", "Nâu"),
        new("gray", "Xám"),
        new("black", "Đen"),
        new("lime", "Xanh chanh"),
        new("cyan", "Xanh cyan"),
        new("indigo", "Xanh chàm")
    ];

    public static IReadOnlyList<Option> IconOptions { get; } =
    [
        new("check", "Có mặt"),
        new("x", "Vắng"),
        new("graduation", "Đi học"),
        new("briefcase", "Công tác"),
        new("clock", "Đồng hồ"),
        new("plane", "Máy bay"),
        new("baby", "Thai sản"),
        new("sick", "Nghỉ ốm"),
        new("late", "Đi trễ"),
        new("moon", "Trực đêm nghỉ"),
        new("home", "Nghỉ tại nhà"),
        new("pending", "Chờ"),
        new("coffee", "Giải lao"),
        new("car", "Đi công việc ngoài"),
        new("hospital", "Đi khám bệnh"),
        new("train", "Đi công tác xa"),
        new("sun", "Ca sáng"),
        new("star", "Ca đặc biệt"),
        new("shield", "Bảo vệ"),
        new("tools", "Sửa chữa")
    ];

    public static string GetColorLabel(string? colorKey)
    {
        var match = ColorOptions.FirstOrDefault(o =>
            string.Equals(o.Value, colorKey, StringComparison.OrdinalIgnoreCase));
        return match?.Label ?? colorKey ?? "—";
    }

    public static string GetIconLabel(string? iconKey)
    {
        var match = IconOptions.FirstOrDefault(o =>
            string.Equals(o.Value, iconKey, StringComparison.OrdinalIgnoreCase));
        return match?.Label ?? iconKey ?? "—";
    }
}
