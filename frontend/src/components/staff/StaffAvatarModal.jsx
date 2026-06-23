import StaffAvatarMobileModal from './mobile/StaffAvatarMobileModal';
import StaffAvatarDesktopModal from './StaffAvatarDesktopModal';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function StaffAvatarModal({ staff, onSave, onClose }) {
  const isMobile = useIsMobile();

  if (!staff) return null;

  if (isMobile) {
    return <StaffAvatarMobileModal staff={staff} onSave={onSave} onClose={onClose} />;
  }

  return <StaffAvatarDesktopModal staff={staff} onSave={onSave} onClose={onClose} />;
}
