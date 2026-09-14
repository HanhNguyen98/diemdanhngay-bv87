using System.IO;
using System.Runtime.InteropServices;

namespace BV87.App.Hardware;

/// <summary>Loads libzkfp.dll from bundled lib\ via SetDllDirectory + NativeLibrary (D1.1l).</summary>
internal static class ZkNativeLibraryBootstrap
{
    private static readonly object Gate = new();
    private static bool _loaded;

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool SetDllDirectory(string? lpPathName);

    public static string LibDirectory => Path.Combine(AppContext.BaseDirectory, "lib");

    public static string BundledDllPath => Path.Combine(LibDirectory, "libzkfp.dll");

    public static string? ResolveLibZkfpPath()
    {
        if (File.Exists(BundledDllPath))
        {
            return BundledDllPath;
        }

        var system32 = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.System),
            "libzkfp.dll");
        return File.Exists(system32) ? system32 : null;
    }

    public static bool IsAvailable() => ResolveLibZkfpPath() != null;

    /// <summary>Call once before any ZKFPM_* P/Invoke — thread-safe.</summary>
    public static void EnsureLoaded()
    {
        lock (Gate)
        {
            if (_loaded)
            {
                return;
            }

            var path = ResolveLibZkfpPath()
                ?? throw new DllNotFoundException(Core.Constants.UtilitiesUiStrings.FingerprintEnroll.DeviceMissingDll);

            var dllDir = Path.GetDirectoryName(path)!;
            var bundledDir = Path.GetFullPath(LibDirectory);
            var resolvedDir = Path.GetFullPath(dllDir);

            if (resolvedDir.Equals(bundledDir, StringComparison.OrdinalIgnoreCase))
            {
                if (!SetDllDirectory(resolvedDir))
                {
                    throw new DllNotFoundException(
                        Core.Constants.UtilitiesUiStrings.FingerprintEnroll.DeviceMissingDll);
                }
            }

            if (!NativeLibrary.TryLoad(path, out _))
            {
                if (resolvedDir.Equals(bundledDir, StringComparison.OrdinalIgnoreCase))
                {
                    SetDllDirectory(null);
                }

                throw new DllNotFoundException(Core.Constants.UtilitiesUiStrings.FingerprintEnroll.DeviceMissingDll);
            }

            _loaded = true;
        }
    }
}
