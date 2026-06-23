import { useCallback, useRef, useState } from 'react';
import { Camera, Image, Pencil, Trash2, X } from 'lucide-react';
import { UI } from '../../../constants/attendance';
import InlineErrorBanner from '../../shared/InlineErrorBanner';
import { getInitials } from '../../../utils/formatters';
import {
  AVATAR_ACCEPT,
  readAvatarAsDataUrl,
  validateAvatarFile,
} from '../../../utils/avatarUpload';

const ACTION_CARD_CLASS =
  'flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface-white py-4 px-3 text-center transition-colors hover:bg-neutral';

export default function StaffAvatarMobileModal({ staff, onSave, onClose }) {
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(staff?.avatarUrl || null);

  const processFile = useCallback(async (file, fileCount = 1) => {
    if (fileCount > 1) {
      setAvatarError('Chỉ được tải lên một ảnh đại diện.');
      return;
    }
    const validationError = validateAvatarFile(file);
    if (validationError) {
      setAvatarError(validationError);
      return;
    }
    try {
      const dataUrl = await readAvatarAsDataUrl(file);
      setAvatarUrl(dataUrl);
      setAvatarError('');
    } catch (err) {
      setAvatarError(err.message || 'Không đọc được tệp ảnh. Vui lòng thử lại.');
    }
  }, []);

  const handleFiles = useCallback(
    (files) => {
      if (!files?.length) return;
      processFile(files[0], files.length);
    },
    [processFile],
  );

  const handleClear = () => {
    setAvatarUrl(null);
    setAvatarError('');
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (avatarError) return;
    setLoading(true);
    try {
      await onSave(avatarUrl);
    } catch (err) {
      setError(err.message || 'Không thể cập nhật ảnh đại diện.');
    } finally {
      setLoading(false);
    }
  };

  if (!staff) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-avatar-mobile-title"
    >
      <div className="bg-surface-white w-full max-w-md rounded-2xl shadow-panel overflow-hidden animate-fade-in max-h-[92dvh] flex flex-col">
        <div className="relative shrink-0 px-5 pt-4 pb-3">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center text-content-muted hover:bg-neutral hover:text-gray-800 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center space-y-1.5 px-8">
            <h2 id="staff-avatar-mobile-title" className="text-lg font-bold text-navy leading-snug">
              {UI.staffAvatarTitle}
            </h2>
            <p className="text-sm text-primary tabular-nums">
              {staff.fullname} - {UI.staffAvatarIdPrefix} {staff.empCodeFormatted}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-5 pb-4 space-y-5">
            <InlineErrorBanner message={error} />
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-full border-2 border-primary-light overflow-hidden bg-neutral flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-primary">{getInitials(staff.fullname)}</span>
                  )}
                </div>
               
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className={ACTION_CARD_CLASS}
              >
                <Image className="w-6 h-6 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium text-content-heading">{UI.staffAvatarSelectPhoto}</span>
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className={ACTION_CARD_CLASS}
              >
                <Camera className="w-6 h-6 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium text-content-heading">{UI.staffAvatarTakePhoto}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleClear}
              disabled={!avatarUrl}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-danger/25 bg-danger py-2.5 text-sm font-medium text-danger-fg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-danger/80"
            >
              <Trash2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              {UI.staffAvatarDeleteCurrent}
            </button>

            <div className="rounded-xl bg-primary-light px-4 py-3 text-sm text-content-body text-center leading-relaxed">
              {UI.staffAvatarNote}
            </div>

            {avatarError && <p className="text-sm text-danger-fg text-center">{avatarError}</p>}
          </div>

          <div className="shrink-0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl btn-primary text-base font-semibold disabled:opacity-60"
            >
              {loading ? UI.staffAvatarSaving : UI.staffAvatarSave}
            </button>
          </div>
        </form>

        <input
          ref={galleryInputRef}
          type="file"
          accept={AVATAR_ACCEPT}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
