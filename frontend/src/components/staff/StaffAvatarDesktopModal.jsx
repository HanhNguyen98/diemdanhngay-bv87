import { useCallback, useRef, useState } from 'react';
import { Info, Pencil, Trash2, Upload } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import { UI } from '../../constants/attendance';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import { getInitials } from '../../utils/formatters';
import {
  AVATAR_ACCEPT,
  readAvatarAsDataUrl,
  validateAvatarFile,
} from '../../utils/avatarUpload';

export default function StaffAvatarDesktopModal({ staff, onSave, onClose }) {
  const fileInputRef = useRef(null);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      aria-labelledby="staff-avatar-desktop-title"
    >
      <div className="bg-surface-white w-full max-w-xl rounded-2xl border border-line shadow-panel overflow-hidden animate-fade-in flex flex-col">
        <div className="shrink-0 px-8 pt-8 pb-6 text-center space-y-2">
          <h2 id="staff-avatar-desktop-title" className="text-xl font-bold text-navy">
            {UI.staffAvatarTitle}
          </h2>
          <p className="text-sm text-primary tabular-nums">
            {staff.fullname} - {UI.staffAvatarIdPrefix} {staff.empCodeFormatted}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-8 pb-6 space-y-6">
            <InlineErrorBanner message={error} />

            <div className="flex justify-center">
              <div className="relative">
                <div className="w-36 h-36 rounded-full border-2 border-primary-light overflow-hidden bg-neutral flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary">{getInitials(staff.fullname)}</span>
                  )}
                </div>
               
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-primary-light px-4 py-3.5">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-content-body leading-relaxed">{UI.staffAvatarNote}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 h-11 rounded-xl btn-primary text-sm font-semibold"
              >
                <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                {UI.staffAvatarSelectFromComputer}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={!avatarUrl}
                className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-line bg-surface-white text-sm font-medium text-content-body transition-colors hover:bg-neutral disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 shrink-0 text-content-muted" aria-hidden="true" />
                {UI.staffAvatarDeleteCurrent}
              </button>
            </div>

            {avatarError && <p className="text-sm text-danger-fg text-center">{avatarError}</p>}
          </div>

          <div className="shrink-0 flex items-center justify-end gap-3 px-8 py-4 border-t border-line bg-surface-page">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-4 text-sm font-medium text-content-muted hover:text-content-heading transition-colors disabled:opacity-60"
            >
              {ADMIN_UI.form.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 rounded-lg btn-primary text-sm font-semibold disabled:opacity-60"
            >
              {loading ? UI.staffAvatarSaving : UI.staffAvatarSave}
            </button>
          </div>
        </form>

        <input
          ref={fileInputRef}
          type="file"
          accept={AVATAR_ACCEPT}
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
