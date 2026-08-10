import { memo, useCallback, useRef, useState } from 'react';
import { ArrowDown, X } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import {
  AVATAR_ACCEPT,
  AVATAR_ERRORS,
  formatAvatarSize,
  readAvatarAsDataUrl,
  validateAvatarFile,
} from '../../utils/avatarUpload';

const AvatarUpload = memo(function AvatarUpload({
  value,
  onChange,
  onError,
  fieldLabel,
  fieldHint,
  label = ADMIN_UI.form.avatar,
  selectedLabel = ADMIN_UI.form.avatarSelected,
  hint = ADMIN_UI.form.avatarHint,
  removeLabel = ADMIN_UI.form.avatarRemove,
  previewClassName = 'w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-sm',
  previewAlt = 'Ảnh đại diện',
}) {
  const isCompactField = Boolean(fieldLabel);
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(
    async (file, fileCount = 1) => {
      if (fileCount > 1) {
        onError(AVATAR_ERRORS.multiple);
        return;
      }
      const validationError = validateAvatarFile(file);
      if (validationError) {
        onError(validationError);
        return;
      }
      try {
        const dataUrl = await readAvatarAsDataUrl(file);
        onChange(dataUrl);
        onError('');
      } catch (err) {
        onError(err.message || AVATAR_ERRORS.read);
      }
    },
    [onChange, onError],
  );

  const handleFiles = useCallback(
    (files) => {
      if (!files?.length) return;
      processFile(files[0], files.length);
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleClear = useCallback(() => {
    onChange(null);
    onError('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onChange, onError]);

  const fieldHeader = isCompactField ? (
    <div className="px-3 py-2 border-b border-gray-100 bg-surface-page/40">
      <p className="text-sm font-semibold text-gray-800">{fieldLabel}</p>
      {fieldHint && <p className="text-xs text-content-muted mt-0.5">{fieldHint}</p>}
    </div>
  ) : (
    <p className="text-xs font-bold text-content-muted uppercase tracking-wide mb-1.5">{label}</p>
  );

  const selectedPreview = (
    <div
      className={`flex items-center gap-3 p-3 ${isCompactField ? '' : 'border border-gray-200 rounded-lg bg-surface-page/50'
        }`}
    >
      <img src={value} alt={previewAlt} className={previewClassName} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 truncate">{selectedLabel}</p>
        {hint && <p className="text-xs text-content-muted">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={handleClear}
        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-content-muted hover:bg-neutral transition-colors shrink-0"
        aria-label={removeLabel}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const emptyDropZone = (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragOver(false);
      }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`${isCompactField ? 'border-0' : 'border-2 border-dashed rounded-lg'
        } px-4 py-5 text-center cursor-pointer transition-colors ${dragOver
          ? 'bg-primary-light/40'
          : isCompactField
            ? 'hover:bg-surface-page/60'
            : 'border-gray-300 hover:border-primary/50 hover:bg-surface-page/60'
        } ${dragOver && !isCompactField ? 'border-primary' : ''}`}
    >
      <ArrowDown className="w-5 h-5 text-content-muted mx-auto mb-2" />
      <p className="text-sm text-content-muted">
        {ADMIN_UI.form.avatarDropPrefix}{' '}
        <span className="text-primary font-medium">{ADMIN_UI.form.avatarBrowse}</span>{' '}
        {ADMIN_UI.form.avatarDropSuffix}
      </p>
      <p className="text-xs text-content-muted mt-1.5">
        {ADMIN_UI.form.avatarFormats} · {ADMIN_UI.form.avatarMaxSize}
      </p>
    </div>
  );

  return (
    <div>
      {isCompactField ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          {fieldHeader}
          {value ? selectedPreview : emptyDropZone}
        </div>
      ) : (
        <>
          {fieldHeader}
          {value ? selectedPreview : emptyDropZone}
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
});

export { formatAvatarSize };
export default AvatarUpload;
