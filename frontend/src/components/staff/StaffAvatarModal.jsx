import { useState } from 'react';
import FormModal from '../shared/FormModal';
import AvatarUpload from '../shared/AvatarUpload';
import { UI } from '../../constants/attendance';
import InlineErrorBanner from '../shared/InlineErrorBanner';

export default function StaffAvatarModal({ staff, onSave, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(staff?.avatarUrl || null);

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
    <FormModal
      title={UI.staffAvatarTitle}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <InlineErrorBanner message={error} />

      <p className="text-sm text-gray-800 font-semibold">{staff.fullname}</p>
      <p className="text-xs text-content-muted tabular-nums mb-2">{staff.empCodeFormatted}</p>

      <AvatarUpload value={avatarUrl} onChange={setAvatarUrl} onError={setAvatarError} />

      {avatarError && <p className="text-sm text-danger-fg -mt-1">{avatarError}</p>}
    </FormModal>
  );
}
