const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

export function toISODate(year, monthIndex, day) {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function getMonthLabel(monthIndex, year) {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

export function getWeekdayLabels() {
  return WEEKDAY_LABELS;
}

/** Build calendar grid (Mon-first). null = empty cell outside month. */
export function getCalendarGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startPad = (first.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toISODate(year, monthIndex, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export { MONTH_NAMES };
