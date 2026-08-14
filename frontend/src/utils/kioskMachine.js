import { UI } from '../constants/attendance';

export function formatKioskMachine(staff) {
  if (!staff) return UI.emptyCell;
  const parts = [staff.lastKioskLabel, staff.lastKioskHostname, staff.lastKioskIp]
    .map((part) => (part != null ? String(part).trim() : ''))
    .filter(Boolean);
  return parts.length ? parts.join(' · ') : UI.emptyCell;
}
