import { memo, startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { MANUAL_SCHEDULE_UI } from '../../constants/attendance';
import { api } from '../../api/client';
import { todayISO } from '../../utils/formatters';

const MAX_SPAN_DAYS = 400;

function formatDmy(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function addDaysIso(iso, delta) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function daysInclusive(from, to) {
  if (!from || !to) return 0;
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.floor((b - a) / 86400000) + 1;
}

const ScheduleTable = memo(function ScheduleTable({ items }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[28rem] table-fixed">
        <colgroup>
          <col style={{ width: '28%' }} />
          <col style={{ width: '28%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '28%' }} />
        </colgroup>
        <thead>
          <tr className="table-header-row">
            <th className="table-th-left whitespace-nowrap">{MANUAL_SCHEDULE_UI.colFrom}</th>
            <th className="table-th-left whitespace-nowrap">{MANUAL_SCHEDULE_UI.colTo}</th>
            <th className="table-th-left whitespace-nowrap">{MANUAL_SCHEDULE_UI.colDays}</th>
            <th className="table-th-left whitespace-nowrap">{MANUAL_SCHEDULE_UI.colStatus}</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-content-muted">
                {MANUAL_SCHEDULE_UI.empty}
              </td>
            </tr>
          ) : (
            items.map((row, idx) => (
              <tr key={`${row.status}-${row.fromDate}-${row.toDate}-${idx}`} className="border-t border-line">
                <td className="px-4 py-2.5 whitespace-nowrap tabular-nums text-navy">
                  {formatDmy(row.fromDate)}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap tabular-nums text-navy">
                  {formatDmy(row.toDate)}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap tabular-nums text-content-muted">
                  {row.dayCount}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap tabular-nums text-content-muted">
                  {row.statusLabel || row.status}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});

/**
 * Read-only modal: merged manual periods; user from/to filter (SPEC §3.2.2).
 * Search must not remount/opacity-flash thead — spinner only on Tìm button.
 */
const ManualScheduleModal = memo(function ManualScheduleModal({ staff, onClose }) {
  const [fromDate, setFromDate] = useState(() => addDaysIso(todayISO(), -30));
  const [toDate, setToDate] = useState(() => addDaysIso(todayISO(), 365));
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const requestIdRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const empCode = staff?.empCode;

  const load = useCallback(async (from, to) => {
    if (empCode == null) return;
    const requestId = ++requestIdRef.current;
    const isRefresh = hasLoadedOnceRef.current;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setInitialLoading(true);
    }
    try {
      const res = await api.getManualSchedule(empCode, from, to);
      if (requestId !== requestIdRef.current) return;
      const next = Array.isArray(res?.items) ? res.items : [];
      startTransition(() => {
        setItems(next);
        setError('');
      });
      hasLoadedOnceRef.current = true;
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(e?.message || MANUAL_SCHEDULE_UI.loadError);
      if (!hasLoadedOnceRef.current) {
        setItems([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [empCode]);

  useEffect(() => {
    hasLoadedOnceRef.current = false;
    const from = addDaysIso(todayISO(), -30);
    const to = addDaysIso(todayISO(), 365);
    setFromDate(from);
    setToDate(to);
    setItems([]);
    setError('');
    setInitialLoading(true);
    load(from, to);
    // Only re-bootstrap when employee changes — not when load identity changes mid-search
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empCode]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (refreshing || initialLoading) return;
    if (!fromDate || !toDate) {
      setError('Vui lòng chọn đủ Từ và Đến.');
      return;
    }
    if (toDate < fromDate) {
      setError(MANUAL_SCHEDULE_UI.invalidOrder);
      return;
    }
    if (daysInclusive(fromDate, toDate) > MAX_SPAN_DAYS) {
      setError(MANUAL_SCHEDULE_UI.tooLong);
      return;
    }
    load(fromDate, toDate);
  };

  const code = staff?.empCodeFormatted || (empCode != null ? String(empCode).padStart(5, '0') : '—');
  const name = staff?.fullname || '—';
  const subtitle = `${code} - ${name}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4 py-0 sm:py-6">
      <div className="bg-surface-white shadow-panel w-full max-w-2xl max-h-[92dvh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden">
        <div className="shrink-0 px-4 sm:px-5 py-3 border-b border-line flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-navy">{MANUAL_SCHEDULE_UI.title}</h2>
            <p className="text-xs text-content-muted mt-0.5 truncate">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-content-muted hover:text-gray-800"
            aria-label={MANUAL_SCHEDULE_UI.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row sm:items-end gap-2.5"
          >
            <label className="block min-w-0 flex-1">
              <span className="text-xs font-medium text-content-muted">{MANUAL_SCHEDULE_UI.filterFrom}</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-line px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </label>
            <label className="block min-w-0 flex-1">
              <span className="text-xs font-medium text-content-muted">{MANUAL_SCHEDULE_UI.filterTo}</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-line px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </label>
            <button
              type="submit"
              className="h-10 w-full sm:w-[7.5rem] shrink-0 inline-flex items-center justify-center gap-1.5 px-4 rounded-lg btn-primary text-sm font-medium"
            >
              <Search className="w-4 h-4 shrink-0" aria-hidden />
              {MANUAL_SCHEDULE_UI.filterSearch}
            </button>
          </form>

          {/* Reserved slot — avoids table jump when error appears/clears */}
          <div className="min-h-[1.25rem]" aria-live="polite">
            {error ? <p className="text-sm text-danger-fg">{error}</p> : null}
          </div>

          <div className="min-h-[10rem]">
            {initialLoading ? (
              <p className="text-sm text-content-muted py-8 text-center animate-pulse">
                {MANUAL_SCHEDULE_UI.loading}
              </p>
            ) : (
              <ScheduleTable items={items} />
            )}
          </div>
        </div>

        <div className="shrink-0 flex justify-end px-4 sm:px-5 py-3 border-t border-line bg-surface-white pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg btn-primary text-sm">
            {MANUAL_SCHEDULE_UI.close}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ManualScheduleModal;
