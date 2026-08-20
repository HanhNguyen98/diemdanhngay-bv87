import { UI } from '../constants/attendance';
import { displayIp } from './formatters';

/**
 * Kiosk machine string from label / hostname / ip parts (SPEC §4.13.6 / §10.3).
 */
export function formatKioskMachineParts(label, hostname, ip) {
  const parts = [label, hostname, displayIp(ip)]
    .map((part) => (part != null ? String(part).trim() : ''))
    .filter(Boolean);
  return parts.join(' · ');
}

/** Roster column: last kiosk fields from staff attendance row. */
export function formatKioskMachine(staff) {
  if (!staff) return UI.emptyCell;
  const formatted = formatKioskMachineParts(
    staff.lastKioskLabel,
    staff.lastKioskHostname,
    staff.lastKioskIp,
  );
  return formatted || UI.emptyCell;
}
