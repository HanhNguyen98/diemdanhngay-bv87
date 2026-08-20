import { todayISO } from './formatters';

/** Mặc định: đầu tháng hiện tại → hôm nay (theo mockup lọc lịch sử). */
export function defaultReminderHistoryRange(refDate = todayISO()) {
  const [y, m] = refDate.split('-');
  return { from: `${y}-${m}-01`, to: refDate };
}

export function formatLogDateTime(iso) {
  if (!iso) return '';
  const [datePart, timePart] = iso.split('T');
  const [y, m, d] = datePart.split('-');
  const time = timePart ? timePart.slice(0, 5) : '';
  return `${d}/${m}/${y}${time ? ` ${time}` : ''}`;
}

/** Admin log columns: dd/mm/yyyy HH:mm or em-dash when empty. */
export function formatLogDateTimeOrDash(iso) {
  return formatLogDateTime(iso) || '—';
}

/** Time portion only (HH:mm) for mobile reminder cards. */
export function formatLogTimeHM(iso) {
  if (!iso) return '';
  const timePart = iso.split('T')[1];
  return timePart ? timePart.slice(0, 5) : '';
}
