namespace BV87.Core.Models.Admin;

/// <summary>GET /api/admin/system/storage — D-DISK.1.</summary>
public sealed class ServerStorageResponse
{
    public string? Level { get; set; }
    public string? Message { get; set; }
    public string? Drive { get; set; }
    public double? FreePercent { get; set; }
    public long? FreeBytes { get; set; }
    public long? UsedBytes { get; set; }
    public long? TotalBytes { get; set; }
    public string? CheckedAt { get; set; }
}
