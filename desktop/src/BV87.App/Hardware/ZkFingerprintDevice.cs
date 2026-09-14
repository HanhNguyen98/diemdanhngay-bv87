using System.Collections.Concurrent;
using System.Windows.Threading;
using BV87.Core.Models.Kiosk;

namespace BV87.App.Hardware;

/// <summary>USB ZK9500 — single SdkThread owns all libzkfp calls (parity ZKFPDemo).</summary>
public sealed class ZkFingerprintDevice : IDisposable
{
    /// <summary>SDK template capacity — must match Agent Java (2048 bytes for DBMatch/DBMerge).</summary>
    public const int TemplateCapacity = 2048;

    private const int MaxImageBytes = 512 * 512;
    /// <summary>Parity ZKFPDemo WorkThread — sleep after each acquire attempt.</summary>
    private const int SdkPollIntervalMs = 500;
    private const int EnrollSampleCount = 3;

    private static readonly object GlobalSdkGate = new();
    private static int _activeSessions;

    private readonly object _sync = new();
    private readonly ConcurrentQueue<Action> _workQueue = new();
    private readonly AutoResetEvent _workPulse = new(false);

    private Thread? _sdkThread;
    private volatile bool _sdkStop = true;

    private IntPtr _device = IntPtr.Zero;
    private IntPtr _db = IntPtr.Zero;
    private bool _initialized;
    private int _imageWidth = 256;
    private int _imageHeight = 288;
    private byte[] _imageBuffer = new byte[MaxImageBytes];
    private readonly byte[] _acquireTemplate = new byte[TemplateCapacity];

    private Dispatcher? _uiDispatcher;
    private volatile bool _registering;
    private int _enrollIdx;
    private byte[][] _regTempArray = Array.Empty<byte[]>();
    private Action<FingerprintEnrollEvent>? _enrollHandler;
    private TaskCompletionSource<FingerprintEnrollSessionResult>? _enrollTcs;
    private CancellationToken _enrollCancellation;

    private volatile bool _scanMode;
    private Action<FingerprintScanEvent>? _scanHandler;
    private readonly Dictionary<int, KioskTemplateDto> _fidToTemplate = new();

    public bool IsScanMode => _scanMode;

    public bool IsConnected => _device != IntPtr.Zero;

    public int LoadedTemplateCount => _fidToTemplate.Count;

    public int ImageHeight => _imageHeight;

    public static bool IsNativeLibraryAvailable() => ZkNativeLibraryBootstrap.IsAvailable();

    public static bool ProbeHardwarePresent()
    {
        if (!IsNativeLibraryAvailable())
        {
            return false;
        }

        lock (GlobalSdkGate)
        {
            if (_activeSessions > 0)
            {
                return true;
            }

            try
            {
                ZkNativeLibraryBootstrap.EnsureLoaded();
                if (ZkNative.Init() != ZkNative.ZKFP_ERR_OK)
                {
                    return false;
                }

                var count = ZkNative.GetDeviceCount();
                ZkNative.Terminate();
                return count > 0;
            }
            catch
            {
                return false;
            }
        }
    }

    public void Connect()
    {
        Trace("Connect", "queued");
        EnsureSdkThreadRunning();
        RunOnSdkThread(static device => device.OpenDeviceInternal());
    }

    public void Disconnect()
    {
        Trace("Disconnect", "queued");
        if (_sdkThread == null)
        {
            return;
        }

        RunOnSdkThread(static device =>
        {
            device.CancelEnrollInternal();
            device._scanMode = false;
            device._scanHandler = null;
            device._fidToTemplate.Clear();
            device.CloseDeviceInternal();
        });

        StopSdkThread();
        _uiDispatcher = null;
    }

    /// <summary>Starts enroll — SdkThread acquires and runs onExtractOk synchronously; UI gets clones only.</summary>
    public Task<FingerprintEnrollSessionResult> BeginEnrollAsync(
        Dispatcher uiDispatcher,
        Action<FingerprintEnrollEvent> onEvent,
        CancellationToken cancellationToken)
    {
        if (!IsConnected)
        {
            throw new InvalidOperationException(Core.Constants.UtilitiesUiStrings.FingerprintEnroll.DeviceOpenFail);
        }

        var tcs = new TaskCompletionSource<FingerprintEnrollSessionResult>(
            TaskCreationOptions.RunContinuationsAsynchronously);

        EnqueueOnSdkThread(device =>
        {
            device.CancelEnrollInternal();
            device._uiDispatcher = uiDispatcher;
            device._enrollTcs = tcs;
            device._enrollHandler = onEvent;
            device._enrollCancellation = cancellationToken;
            device._enrollIdx = 0;
            device._regTempArray = new byte[EnrollSampleCount][];
            for (var i = 0; i < EnrollSampleCount; i++)
            {
                device._regTempArray[i] = new byte[TemplateCapacity];
            }

            device._registering = true;
            device.Trace("BeginEnroll", "registering=true");
        });

        cancellationToken.Register(EnqueueCancelEnroll);

        return tcs.Task;
    }

    public void CancelEnroll()
    {
        Trace("CancelEnroll", "requested");
        EnqueueCancelEnroll();
    }

    /// <summary>Starts Identify polling — SdkThread acquires and runs DBIdentify.</summary>
    public void BeginScanMode(Dispatcher uiDispatcher, Action<FingerprintScanEvent> onEvent)
    {
        EnqueueOnSdkThread(device =>
        {
            device.CancelEnrollInternal();
            device._uiDispatcher = uiDispatcher;
            device._scanHandler = onEvent;
            device._scanMode = true;
            device._registering = false;
            device.Trace("BeginScanMode", "scanMode=true");
        });
    }

    public void EndScanMode()
    {
        EnqueueOnSdkThread(device =>
        {
            device._scanMode = false;
            device._scanHandler = null;
            device._fidToTemplate.Clear();
            device.Trace("EndScanMode", "scanMode=false");
        });
    }

    public Task<IdentifyTemplateLoadResult> ReloadIdentifyTemplatesAsync(
        IReadOnlyList<KioskTemplateDto> templates,
        CancellationToken cancellationToken = default)
    {
        var tcs = new TaskCompletionSource<IdentifyTemplateLoadResult>(
            TaskCreationOptions.RunContinuationsAsynchronously);

        EnqueueOnSdkThread(device =>
        {
            if (cancellationToken.IsCancellationRequested)
            {
                tcs.TrySetCanceled(cancellationToken);
                return;
            }

            try
            {
                tcs.TrySetResult(device.ApplyTemplatesInternal(templates));
            }
            catch (Exception ex)
            {
                tcs.TrySetException(ex);
            }
        });

        if (cancellationToken.CanBeCanceled)
        {
            cancellationToken.Register(() => tcs.TrySetCanceled(cancellationToken));
        }

        return tcs.Task;
    }

    public void Dispose()
    {
        Disconnect();
        _workPulse.Dispose();
    }

    private void Trace(string phase, string detail = "")
    {
        FingerprintTraceLog.Write(phase, detail);
    }

    private void EnsureSdkThreadRunning()
    {
        if (_sdkThread != null && !_sdkStop)
        {
            return;
        }

        _sdkStop = false;
        _sdkThread = new Thread(SdkThreadMain)
        {
            IsBackground = true,
            Name = "ZkFingerprintSdkThread"
        };
        _sdkThread.Start();
        Trace("SdkThread", "started");
    }

    private void StopSdkThread()
    {
        _sdkStop = true;
        _workPulse.Set();
        _sdkThread?.Join(3000);
        _sdkThread = null;
        Trace("SdkThread", "stopped");
    }

    private void RunOnSdkThread(Action<ZkFingerprintDevice> action)
    {
        EnsureSdkThreadRunning();
        var done = new ManualResetEventSlim(false);
        Exception? error = null;

        _workQueue.Enqueue(() =>
        {
            try
            {
                action(this);
            }
            catch (Exception ex)
            {
                error = ex;
                Trace("SdkThread ERROR", ex.Message);
            }
            finally
            {
                done.Set();
            }
        });

        _workPulse.Set();
        done.Wait();

        if (error != null)
        {
            throw error;
        }
    }

    private void EnqueueOnSdkThread(Action<ZkFingerprintDevice> action)
    {
        EnsureSdkThreadRunning();
        _workQueue.Enqueue(() =>
        {
            try
            {
                action(this);
            }
            catch (Exception ex)
            {
                Trace("SdkThread ERROR", ex.Message);
                FailEnroll(ex.Message);
            }
        });
        _workPulse.Set();
    }

    private void SdkThreadMain()
    {
        while (!_sdkStop)
        {
            while (_workQueue.TryDequeue(out var work))
            {
                try
                {
                    work();
                }
                catch (Exception ex)
                {
                    Trace("WorkQueue ERROR", ex.Message);
                    FailEnroll(ex.Message);
                }
            }

            if (_device != IntPtr.Zero)
            {
                try
                {
                    if (_registering)
                    {
                        PollEnrollOnce();
                    }
                    else if (_scanMode)
                    {
                        PollScanOnce();
                    }
                }
                catch (Exception ex)
                {
                    Trace("Poll ERROR", ex.Message);
                    if (_registering)
                    {
                        FailEnroll(ex.Message);
                    }
                }
            }

            if (_sdkStop)
            {
                break;
            }

            _workPulse.WaitOne(SdkPollIntervalMs);
        }
    }

    private void PollEnrollOnce()
    {
        if (_enrollCancellation.IsCancellationRequested)
        {
            Trace("Poll", "cancel requested");
            CancelEnrollInternal();
            return;
        }

        if (!_registering)
        {
            return;
        }

        Trace("Poll", $"registering idx={_enrollIdx}");

        var capture = TryCaptureSampleWithImageUnsafe();
        if (capture == null || !_registering)
        {
            return;
        }

        Trace("OnExtractOk", $"enter idx={_enrollIdx}");
        ProcessExtractOnSdk(capture);
        Trace("OnExtractOk", $"exit idx={_enrollIdx}");
    }

    private void PollScanOnce()
    {
        if (!_scanMode || _db == IntPtr.Zero)
        {
            return;
        }

        var capture = TryCaptureSampleWithImageUnsafe();
        if (capture == null)
        {
            return;
        }

        PostScanEvent(new FingerprintScanEvent
        {
            Kind = FingerprintScanEventKind.Preview,
            Capture = capture
        });

        var fid = 0;
        var score = 0;
        Trace("BEFORE DBIdentify", $"db={_db:X}");
        var ret = ZkNative.DBIdentify(_db, capture.Template, ref fid, ref score);
        Trace("AFTER DBIdentify", $"ret={ret} fid={fid} score={score}");
        if (ret != ZkNative.ZKFP_ERR_OK)
        {
            PostScanEvent(new FingerprintScanEvent { Kind = FingerprintScanEventKind.IdentifyFailed });
            return;
        }

        if (!_fidToTemplate.TryGetValue(fid, out var matched))
        {
            PostScanEvent(new FingerprintScanEvent
            {
                Kind = FingerprintScanEventKind.IdentifyUnmapped,
                Fid = fid,
                Score = score
            });
            return;
        }

        PostScanEvent(new FingerprintScanEvent
        {
            Kind = FingerprintScanEventKind.IdentifyMatched,
            EmpCode = matched.EmpCode,
            Fullname = matched.Fullname,
            Score = score,
            Capture = capture
        });
    }

    private IdentifyTemplateLoadResult ApplyTemplatesInternal(IReadOnlyList<KioskTemplateDto> templates)
    {
        if (_db == IntPtr.Zero)
        {
            return new IdentifyTemplateLoadResult();
        }

        _fidToTemplate.Clear();
        ZkNative.DBClear(_db);

        var loaded = 0;
        var skipped = 0;
        foreach (var item in templates)
        {
            if (string.IsNullOrWhiteSpace(item.TemplateBase64))
            {
                skipped++;
                continue;
            }

            byte[] blob;
            try
            {
                blob = Convert.FromBase64String(item.TemplateBase64);
            }
            catch
            {
                skipped++;
                Trace("ApplyTemplates", $"base64 fail emp={item.EmpCode}");
                continue;
            }

            var template = new byte[TemplateCapacity];
            Buffer.BlockCopy(blob, 0, template, 0, Math.Min(blob.Length, TemplateCapacity));
            var fid = item.EmpCode;
            ZkNative.DBDel(_db, fid);
            var ret = ZkNative.DBAdd(_db, fid, template);
            if (ret == ZkNative.ZKFP_ERR_OK)
            {
                _fidToTemplate[fid] = item;
                loaded++;
            }
            else
            {
                skipped++;
                Trace("ApplyTemplates", $"DBAdd fail emp={fid} ret={ret}");
            }
        }

        return new IdentifyTemplateLoadResult
        {
            Total = templates.Count,
            Loaded = loaded,
            Skipped = skipped
        };
    }

    private void PostScanEvent(FingerprintScanEvent evt)
    {
        var handler = _scanHandler;
        var dispatcher = _uiDispatcher;
        if (handler == null || dispatcher == null)
        {
            return;
        }

        _ = dispatcher.BeginInvoke(() =>
        {
            try
            {
                handler(evt);
            }
            catch (Exception ex)
            {
                Trace("ScanHandler ERROR", ex.Message);
            }
        });
    }

    /// <summary>Parity ZKFPDemo OnExtractOK — all libzkfp on SdkThread; UI gets events via BeginInvoke only.</summary>
    private void ProcessExtractOnSdk(FingerprintCapturePayload capture)
    {
        if (!_registering || _db == IntPtr.Zero)
        {
            Trace("OnExtractOk", "skip not registering or db=0");
            return;
        }

        if (_enrollIdx > 0)
        {
            Trace("BEFORE DBMatch", $"idx={_enrollIdx} db={_db:X}");
            var match = ZkNative.DBMatch(_db, capture.Template, _regTempArray[_enrollIdx - 1]);
            Trace("AFTER DBMatch", $"match={match}");
            if (match == ZkNative.ZKFP_ERR_INVALID_PARAM)
            {
                FailEnroll(Core.Constants.UtilitiesUiStrings.FingerprintEnroll.SdkMatchInvalidParam);
                return;
            }

            if (match <= 0)
            {
                PostUiEvent(new FingerprintEnrollEvent
                {
                    Kind = FingerprintEnrollEventKind.SameFingerRejected,
                    CompletedScans = _enrollIdx,
                    Capture = capture
                });
                return;
            }
        }

        Buffer.BlockCopy(capture.Template, 0, _regTempArray[_enrollIdx], 0, TemplateCapacity);
        _enrollIdx++;
        Trace("Sample stored", $"idx={_enrollIdx}");

        PostUiEvent(new FingerprintEnrollEvent
        {
            Kind = FingerprintEnrollEventKind.SampleAccepted,
            CompletedScans = _enrollIdx,
            Capture = capture
        });

        if (_enrollIdx < EnrollSampleCount)
        {
            return;
        }

        _registering = false;
        Trace("BEFORE DBMerge", "3 samples");

        var regTemp = new byte[TemplateCapacity];
        var regLen = TemplateCapacity;
        var ret = ZkNative.DBMerge(_db, _regTempArray[0], _regTempArray[1], _regTempArray[2], regTemp, ref regLen);
        Trace("AFTER DBMerge", $"ret={ret} len={regLen}");
        if (ret != ZkNative.ZKFP_ERR_OK || regLen <= 0)
        {
            var message = Core.Constants.UtilitiesUiStrings.FingerprintEnroll.MergeFail;
            PostUiEvent(new FingerprintEnrollEvent
            {
                Kind = FingerprintEnrollEventKind.MergeFailed,
                CompletedScans = _enrollIdx,
                ErrorMessage = message
            });
            CompleteEnroll(new FingerprintEnrollSessionResult
            {
                SampleCount = _enrollIdx,
                ErrorMessage = message
            });
            return;
        }

        var merged = new byte[regLen];
        Buffer.BlockCopy(regTemp, 0, merged, 0, regLen);
        CompleteEnroll(new FingerprintEnrollSessionResult
        {
            SampleCount = EnrollSampleCount,
            MergedBase64 = Convert.ToBase64String(merged),
            MergedLength = regLen
        });
    }

    private void PostUiEvent(FingerprintEnrollEvent evt)
    {
        var dispatcher = _uiDispatcher;
        var handler = _enrollHandler;
        if (dispatcher == null || handler == null)
        {
            return;
        }

        Trace("PostUiEvent", evt.Kind.ToString());
        dispatcher.BeginInvoke(() => handler(evt));
    }

    private void CompleteEnroll(FingerprintEnrollSessionResult result)
    {
        Trace("CompleteEnroll", result.Cancelled ? "cancelled" : $"samples={result.SampleCount}");
        _enrollTcs?.TrySetResult(result);
        _enrollTcs = null;
        _enrollHandler = null;
        _uiDispatcher = null;
    }

    private void FailEnroll(string message)
    {
        Trace("FailEnroll", message);
        _registering = false;
        _enrollTcs?.TrySetResult(new FingerprintEnrollSessionResult
        {
            SampleCount = _enrollIdx,
            ErrorMessage = message
        });
        _enrollTcs = null;
        _enrollHandler = null;
        _uiDispatcher = null;
    }

    private void EnqueueCancelEnroll()
    {
        _registering = false;
        _workQueue.Enqueue(CancelEnrollInternal);
        _workPulse.Set();
    }

    private void CancelEnrollInternal()
    {
        if (_enrollTcs == null)
        {
            _enrollIdx = 0;
            _uiDispatcher = null;
            return;
        }

        var sampleCount = _enrollIdx;
        _enrollIdx = 0;
        Trace("CancelEnrollInternal", $"samples={sampleCount}");
        _enrollTcs.TrySetResult(new FingerprintEnrollSessionResult
        {
            Cancelled = true,
            SampleCount = sampleCount
        });
        _enrollTcs = null;
        _enrollHandler = null;
        _uiDispatcher = null;
    }

    private void OpenDeviceInternal()
    {
        lock (_sync)
        {
            if (_device != IntPtr.Zero)
            {
                Trace("OpenDevice", "already open");
                return;
            }

            Trace("BEFORE Init", "");
            lock (GlobalSdkGate)
            {
                ZkNativeLibraryBootstrap.EnsureLoaded();
                if (ZkNative.Init() != ZkNative.ZKFP_ERR_OK)
                {
                    throw new InvalidOperationException(Core.Constants.UtilitiesUiStrings.FingerprintEnroll.DeviceOpenFail);
                }

                _initialized = true;
            }
            Trace("AFTER Init", "ok");

            var count = ZkNative.GetDeviceCount();
            Trace("GetDeviceCount", count.ToString());
            if (count <= 0)
            {
                CloseDeviceInternal();
                throw new InvalidOperationException(Core.Constants.UtilitiesUiStrings.FingerprintEnroll.NoDevice);
            }

            _device = ZkNative.OpenDevice(0);
            Trace("OpenDevice", $"handle={_device:X}");
            if (_device == IntPtr.Zero)
            {
                CloseDeviceInternal();
                throw new InvalidOperationException(Core.Constants.UtilitiesUiStrings.FingerprintEnroll.DeviceOpenFail);
            }

            _db = ZkNative.DBInit();
            Trace("DBInit", $"handle={_db:X}");
            if (_db == IntPtr.Zero)
            {
                CloseDeviceInternal();
                throw new InvalidOperationException(Core.Constants.UtilitiesUiStrings.FingerprintEnroll.DeviceOpenFail);
            }

            ReadImageDimensionsUnsafe();
            Trace("ImageSize", $"{_imageWidth}x{_imageHeight}");
            var needed = ImageByteLength;
            if (needed > 0 && needed <= MaxImageBytes)
            {
                _imageBuffer = new byte[needed];
            }

            Interlocked.Increment(ref _activeSessions);
        }
    }

    private void CloseDeviceInternal()
    {
        Trace("CloseDevice", "start");
        var hadSession = _device != IntPtr.Zero;

        if (_db != IntPtr.Zero)
        {
            ZkNative.DBFree(_db);
            _db = IntPtr.Zero;
        }

        if (_device != IntPtr.Zero)
        {
            ZkNative.CloseDevice(_device);
            _device = IntPtr.Zero;
        }

        if (_initialized)
        {
            lock (GlobalSdkGate)
            {
                ZkNative.Terminate();
                _initialized = false;
            }
        }

        if (hadSession)
        {
            Interlocked.Decrement(ref _activeSessions);
        }

        Trace("CloseDevice", "done");
    }

    private int ImageByteLength => Math.Max(_imageWidth * _imageHeight, 0);

    private FingerprintCapturePayload? TryCaptureSampleWithImageUnsafe()
    {
        if (_device == IntPtr.Zero)
        {
            return null;
        }

        Array.Clear(_acquireTemplate, 0, _acquireTemplate.Length);
        var templateLen = TemplateCapacity;
        var imageBytes = ImageByteLength;
        if (imageBytes <= 0)
        {
            return null;
        }

        if (_imageBuffer.Length != imageBytes)
        {
            _imageBuffer = new byte[imageBytes];
        }

        Trace("BEFORE Acquire", $"idx={_enrollIdx} dev={_device:X}");
        var ret = ZkNative.AcquireFingerprint(_device, _imageBuffer, _acquireTemplate, ref templateLen);
        Trace("AFTER Acquire", $"ret={ret} len={templateLen}");
        if (ret != ZkNative.ZKFP_ERR_OK || templateLen <= 0)
        {
            return null;
        }

        var imageCopy = new byte[imageBytes];
        Buffer.BlockCopy(_imageBuffer, 0, imageCopy, 0, imageBytes);

        return new FingerprintCapturePayload
        {
            Template = CloneTemplateBuffer(_acquireTemplate),
            TemplateLength = templateLen,
            Image = imageCopy,
            ImageWidth = _imageWidth,
            ImageHeight = _imageHeight
        };
    }

    private static byte[] CloneTemplateBuffer(byte[] template)
    {
        var copy = new byte[TemplateCapacity];
        Buffer.BlockCopy(template, 0, copy, 0, TemplateCapacity);
        return copy;
    }

    private void ReadImageDimensionsUnsafe()
    {
        var param = new byte[4];
        var size = 4;
        if (ZkNative.GetParameters(_device, 1, param, ref size) == ZkNative.ZKFP_ERR_OK)
        {
            _imageWidth = BitConverter.ToInt32(param, 0);
        }

        size = 4;
        if (ZkNative.GetParameters(_device, 2, param, ref size) == ZkNative.ZKFP_ERR_OK)
        {
            _imageHeight = BitConverter.ToInt32(param, 0);
        }

        if (_imageWidth <= 0)
        {
            _imageWidth = 256;
        }

        if (_imageHeight <= 0)
        {
            _imageHeight = 288;
        }
    }
}
