const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export function formatDeptCode(code) {
  if (code == null) return '';
  return String(code).padStart(2, '0');
}

export function formatGroupCode(code) {
  if (code == null) return '';
  return String(code).padStart(2, '0');
}

export function formatEmpCode(code) {
  if (code == null) return '';
  return String(code).padStart(5, '0');
}

export function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${DAY_NAMES[date.getDay()]}, ${dd}/${mm}/${y}`;
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

/** dd/mm/yyyy — hiển thị trên date navigator Điểm danh */
export function formatDateDMY(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export function shiftDate(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

/** Trailing unit code in dept name, e.g. "Khoa Dinh dưỡng (C11)" → C11 */
const DEPT_SUFFIX_CODE_RE = /\s*\(([^)]+)\)\s*$/;

/**
 * Split department display name and optional trailing unit code in parentheses.
 * @param {string} name
 * @returns {{ displayName: string, unitCode: string|null }}
 */
export function parseDeptNameParts(name) {
  if (!name) return { displayName: '', unitCode: null };
  const match = name.match(DEPT_SUFFIX_CODE_RE);
  if (!match) return { displayName: name.trim(), unitCode: null };
  return {
    displayName: name.replace(DEPT_SUFFIX_CODE_RE, '').trim(),
    unitCode: match[1].trim(),
  };
}

export function formatDeptDisplayName(name) {
  return parseDeptNameParts(name).displayName;
}

/**
 * Label for department filter dropdowns.
 * If unitCode exists -> [unitCode] deptNameDisplay (fallback to deptName).
 * If unitCode is empty -> keep old behavior: [deptCodeFormatted] deptName.
 */
export function formatDeptFilterLabel(dept) {
  if (!dept) return '';
  const unitCode = dept.unitCode && String(dept.unitCode).trim();

  if (unitCode) {
    const name = dept.deptNameDisplay || dept.deptName;
    return `[${unitCode}] ${name}`;
  }

  const code = dept.deptCodeFormatted || formatDeptCode(dept.deptCode);
  return `[${code}] ${dept.deptName}`;
}

/** So sánh ISO date (YYYY-MM-DD). Trả về âm / 0 / dương. */
export function compareISODate(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function formatTimeVN(date = new Date()) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getRecentDates(count = 4) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

export function displayEmpCode(staff) {
  return staff.empCodeFormatted || formatEmpCode(staff.empCode);
}

export function displayDeptCode(dept) {
  return dept.deptCodeFormatted || formatDeptCode(dept.deptCode);
}

/** ISO date đầu tháng / cuối tháng (month: 1–12). */
export function monthRangeISO(year, month) {
  const lastDay = new Date(year, month, 0).getDate();
  const m = String(month).padStart(2, '0');
  return {
    from: `${year}-${m}-01`,
    to: `${year}-${m}-${String(lastDay).padStart(2, '0')}`,
  };
}

/** Thứ Hai đầu tuần chứa isoDate (ISO YYYY-MM-DD). */
export function weekRangeISO(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  const fromY = date.getFullYear();
  const fromM = String(date.getMonth() + 1).padStart(2, '0');
  const fromD = String(date.getDate()).padStart(2, '0');
  const from = `${fromY}-${fromM}-${fromD}`;
  const end = new Date(fromY, date.getMonth(), date.getDate() + 6);
  const to = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  return { from, to };
}

/** Inclusive day count between ISO dates (YYYY-MM-DD). */
export function daysBetweenInclusive(from, to) {
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  const diff = Math.floor((end - start) / 86_400_000);
  return diff + 1;
}

export function getStatisticsDateRange(preset, refDate = todayISO()) {
  const [y, m, d] = refDate.split('-').map(Number);
  switch (preset) {
    case 'THIS_MONTH':
      return monthRangeISO(y, m);
    case 'LAST_MONTH': {
      const prev = new Date(y, m - 2, 1);
      return monthRangeISO(prev.getFullYear(), prev.getMonth() + 1);
    }
    case 'THIS_WEEK':
      return weekRangeISO(refDate);
    case 'TODAY':
      return { from: refDate, to: refDate };
    case 'LAST_30_DAYS':
      return { from: shiftDate(refDate, -29), to: refDate };
    default:
      return monthRangeISO(y, m);
  }
}
