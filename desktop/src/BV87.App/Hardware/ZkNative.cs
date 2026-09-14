using libzkfpcsharp;

namespace BV87.App.Hardware;

/// <summary>ZKTeco SDK via official libzkfpcsharp (parity C# ZKFinger demo — avoids raw P/Invoke INVALID_PARAM on DBMatch).</summary>
internal static class ZkNative
{
    public const int ZKFP_ERR_OK = 0;
    public const int ZKFP_ERR_INVALID_PARAM = -5;

    public static int Init() => zkfp2.Init();

    public static int Terminate() => zkfp2.Terminate();

    public static int GetDeviceCount() => zkfp2.GetDeviceCount();

    public static IntPtr OpenDevice(int index) => zkfp2.OpenDevice(index);

    public static int CloseDevice(IntPtr devHandle) => zkfp2.CloseDevice(devHandle);

    public static IntPtr DBInit() => zkfp2.DBInit();

    public static int DBFree(IntPtr dbHandle) => zkfp2.DBFree(dbHandle);

    public static int GetParameters(IntPtr devHandle, int code, byte[] paramValue, ref int cbParamValue) =>
        zkfp2.GetParameters(devHandle, code, paramValue, ref cbParamValue);

    /// <summary>Capture image + template — imgBuffer length must equal width×height.</summary>
    public static int AcquireFingerprint(
        IntPtr devHandle,
        byte[] fpImage,
        byte[] fpTemplate,
        ref int cbTemplate) =>
        zkfp2.AcquireFingerprint(devHandle, fpImage, fpTemplate, ref cbTemplate);

    /// <summary>1:1 compare — C# SDK order: current template, then stored template.</summary>
    public static int DBMatch(IntPtr dbHandle, byte[] currentTemplate, byte[] storedTemplate) =>
        zkfp2.DBMatch(dbHandle, currentTemplate, storedTemplate);

    public static int DBMerge(
        IntPtr dbHandle,
        byte[] temp1,
        byte[] temp2,
        byte[] temp3,
        byte[] regTemp,
        ref int cbRegTemp) =>
        zkfp2.DBMerge(dbHandle, temp1, temp2, temp3, regTemp, ref cbRegTemp);

    public static int DBAdd(IntPtr dbHandle, int fid, byte[] template) =>
        zkfp2.DBAdd(dbHandle, fid, template);

    public static int DBDel(IntPtr dbHandle, int fid) =>
        zkfp2.DBDel(dbHandle, fid);

    public static int DBClear(IntPtr dbHandle) =>
        zkfp2.DBClear(dbHandle);

    public static int DBIdentify(IntPtr dbHandle, byte[] template, ref int fid, ref int score) =>
        zkfp2.DBIdentify(dbHandle, template, ref fid, ref score);
}
