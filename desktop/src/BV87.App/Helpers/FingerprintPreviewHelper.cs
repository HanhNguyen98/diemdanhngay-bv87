using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace BV87.App.Helpers;

public static class FingerprintPreviewHelper
{
    public static WriteableBitmap? CreateGrayBitmap(byte[] buffer, int width, int height)
    {
        if (width <= 0 || height <= 0 || buffer.Length < width * height)
        {
            return null;
        }

        var bitmap = new WriteableBitmap(width, height, 96, 96, PixelFormats.Gray8, null);
        bitmap.WritePixels(new System.Windows.Int32Rect(0, 0, width, height), buffer, width, 0);
        return bitmap;
    }
}
