import { memo, useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { SCAN_DIRECTION_LABEL, SCAN_LOG_UI } from '../../constants/attendance';
import { api } from '../../api/client';
import { formatInstantHm } from '../../utils/formatters';

/**
 * Read-only modal: fingerprint scan logs for one employee on one day (SPEC §10.3 lớp B).
 */
const ScanLogModal = memo(function ScanLogModal({ staff, date, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const load = useCallback(async () => {
    if (!staff?.empCode || !date) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.getScanLogs(staff.empCode, date, page, pageSize);
      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotalPages(Math.max(1, res?.totalPages || 1));
    } catch (e) {
      setError(e?.message || SCAN_LOG_UI.loadError);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [staff?.empCode, date, page]);

  useEffect(() => {
    load();
  }, [load]);

  const titleName = staff?.fullname || staff?.empCodeFormatted || '';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4 py-0 sm:py-6">
      <div className="bg-surface-white shadow-panel w-full max-w-3xl max-h-[92dvh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden animate-fade-in">
        <div className="shrink-0 px-4 sm:px-5 py-3 border-b border-line flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-navy">{SCAN_LOG_UI.title}</h2>
            <p className="text-xs text-content-muted mt-0.5 truncate">
              {titleName}
              {staff?.empCodeFormatted ? ` · ${staff.empCodeFormatted}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-content-muted hover:text-gray-800"
            aria-label={SCAN_LOG_UI.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
         {error && <p className="text-sm text-danger-fg">{error}</p>}
          {loading ? (
            <p className="text-sm text-content-muted py-8 text-center animate-pulse">{SCAN_LOG_UI.loading}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-content-muted py-8 text-center">{SCAN_LOG_UI.empty}</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[40rem]">
              <thead>
                <tr className="table-header-row">
                  <th className="table-th-left whitespace-nowrap">{SCAN_LOG_UI.colTime}</th>
                  <th className="table-th-left whitespace-nowrap">{SCAN_LOG_UI.colDirection}</th>
                  <th className="table-th-left whitespace-nowrap">{SCAN_LOG_UI.colScore}</th>
                  <th className="table-th-left whitespace-nowrap">{SCAN_LOG_UI.colMessage}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={`${row.scannedAt}-${idx}`} className="border-t border-line">
                    <td className="px-4 py-2.5 whitespace-nowrap tabular-nums text-navy">
                      {formatInstantHm(row.scannedAt) || '—'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <DirectionBadge direction={row.direction} />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-content-muted tabular-nums">
                      {row.score != null ? `${row.score}%` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-content-muted text-xs whitespace-nowrap">
                      {row.message || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-line bg-surface-white pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2 text-xs text-content-muted">
            {totalPages > 1 && (
              <>
                <button
                  type="button"
                  className="px-2 py-1 rounded border border-line disabled:opacity-40"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                <span>
                  {page}/{totalPages}
                </span>
                <button
                  type="button"
                  className="px-2 py-1 rounded border border-line disabled:opacity-40"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  ›
                </button>
              </>
            )}
          </div>
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg btn-primary text-sm">
            {SCAN_LOG_UI.close}
          </button>
        </div>
      </div>
    </div>
  );
});

function DirectionBadge({ direction }) {
  const label = SCAN_DIRECTION_LABEL[direction] || direction || '—';
  if (direction === 'IN') {
    return <span className="badge-success">{label}</span>;
  }
  if (direction === 'OUT') {
    return <span className="badge-info">{label}</span>;
  }
  if (direction === 'REJECTED') {
    return <span className="badge-danger">{label}</span>;
  }
  return <span className="badge-neutral">{label}</span>;
}

export default ScanLogModal;
