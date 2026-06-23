import { memo, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import { adminApi } from '../../services/api';
import { formatDateDMY, displayEmpCode } from '../../utils/formatters';
import { formatLogDateTime } from '../../utils/reminderHistory';
import InlineErrorBanner from '../shared/InlineErrorBanner';

const { staff: s } = ADMIN_UI;
const cols = s.transferHistoryColumns;

const StaffTransferHistoryModal = memo(function StaffTransferHistoryModal({ staff, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!staff?.empCode) return;

    let cancelled = false;
    setLoading(true);
    setError('');

    adminApi
      .getStaffDepartmentHistory(staff.empCode)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [staff?.empCode]);

  if (!staff) return null;

  const title = s.transferHistoryTitle(staff.fullname, displayEmpCode(staff));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="bg-surface-white rounded-2xl shadow-panel w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-navy pr-4">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-content-muted hover:text-gray-800"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-auto flex-1 min-h-0">
          <InlineErrorBanner message={error} />

          {loading ? (
            <p className="text-sm text-content-muted text-center py-10">{ADMIN_UI.loading}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-content-muted text-center py-10">{s.transferHistoryEmpty}</p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header-row">
                      <th className="table-th-left">{cols.dept}</th>
                      <th className="table-th-left">{cols.fromDate}</th>
                      <th className="table-th-left">{cols.toDate}</th>
                      <th className="table-th-left">{cols.reason}</th>
                      <th className="table-th-left">{cols.createdBy}</th>
                      <th className="table-th-left">{cols.createdAt}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100">
                        <td className="py-3 px-3 text-gray-800">
                          <span className="text-primary tabular-nums mr-1">[{row.deptCodeFormatted}]</span>
                          {row.deptName}
                          {row.current && (
                            <span className="ml-2 badge-success text-3xs">{s.transferHistoryCurrent}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-content-muted tabular-nums">
                          {formatDateDMY(row.fromDate)}
                        </td>
                        <td className="py-3 px-3 text-content-muted tabular-nums">
                          {row.current ? s.transferHistoryCurrent : formatDateDMY(row.toDate)}
                        </td>
                        <td className="py-3 px-3 text-content-muted">{row.reason || '—'}</td>
                        <td className="py-3 px-3 text-content-muted">{row.createdBy}</td>
                        <td className="py-3 px-3 text-content-muted tabular-nums whitespace-nowrap">
                          {formatLogDateTime(row.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {items.map((row) => (
                  <article
                    key={row.id}
                    className="rounded-xl border border-line bg-surface-page/50 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800">
                        <span className="text-primary tabular-nums mr-1">[{row.deptCodeFormatted}]</span>
                        {row.deptName}
                      </p>
                      {row.current && (
                        <span className="badge-success text-3xs shrink-0">{s.transferHistoryCurrent}</span>
                      )}
                    </div>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                      <div>
                        <dt className="text-content-muted">{cols.fromDate}</dt>
                        <dd className="text-gray-800 tabular-nums">{formatDateDMY(row.fromDate)}</dd>
                      </div>
                      <div>
                        <dt className="text-content-muted">{cols.toDate}</dt>
                        <dd className="text-gray-800 tabular-nums">
                          {row.current ? s.transferHistoryCurrent : formatDateDMY(row.toDate)}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-content-muted">{cols.reason}</dt>
                        <dd className="text-gray-800">{row.reason || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-content-muted">{cols.createdBy}</dt>
                        <dd className="text-gray-800">{row.createdBy}</dd>
                      </div>
                      <div>
                        <dt className="text-content-muted">{cols.createdAt}</dt>
                        <dd className="text-gray-800 tabular-nums">{formatLogDateTime(row.createdAt)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-content-muted hover:bg-neutral"
          >
            {ADMIN_UI.form.cancel}
          </button>
        </div>
      </div>
    </div>
  );
});

export default StaffTransferHistoryModal;
