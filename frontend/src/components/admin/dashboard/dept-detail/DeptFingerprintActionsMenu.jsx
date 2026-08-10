import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Fingerprint } from 'lucide-react';
import { ADMIN_UI } from '../../../../constants/admin';

/**
 * Compact dropdown for fingerprint-related Admin actions — SPEC §10.6 / P3g.
 */
const DeptFingerprintActionsMenu = memo(function DeptFingerprintActionsMenu({
  canFillTimes,
  canClear,
  onOpenScanLogs,
  onFillTimes,
  onClearAttendance,
  compact = false,
}) {
  const { dashboard: d } = ADMIN_UI;
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        close();
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const run = (fn) => {
    close();
    fn?.();
  };

  const btnClass = compact
    ? 'inline-flex items-center gap-0.5 rounded-md border border-line bg-surface-white px-1.5 py-0.5 text-3xs font-semibold text-primary hover:bg-primary-light'
    : 'inline-flex items-center gap-1 rounded-lg border border-line bg-surface-white px-2 py-1 text-xs font-semibold text-primary hover:bg-primary-light';

  const itemClass =
    'w-full text-left px-3 py-2 text-xs font-medium text-navy hover:bg-primary-light transition-colors';
  const dangerItemClass =
    'w-full text-left px-3 py-2 text-xs font-medium text-danger-fg hover:bg-danger transition-colors';

  return (
    <div className="relative inline-flex" ref={rootRef}>
      <button
        type="button"
        className={btnClass}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={d.fingerprintMenuAria}
        onClick={() => setOpen((v) => !v)}
      >
        <Fingerprint className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden />
        <span>{d.fingerprintMenu}</span>
        <ChevronDown
          className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[11rem] rounded-lg border border-line bg-surface-white py-1 shadow-card"
        >
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => run(onOpenScanLogs)}
          >
            {d.deptDetailScanLogs}
          </button>
          {canFillTimes ? (
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => run(onFillTimes)}
            >
              {d.fillTimesAction}
            </button>
          ) : null}
          {canClear ? (
            <button
              type="button"
              role="menuitem"
              className={dangerItemClass}
              onClick={() => run(onClearAttendance)}
            >
              {d.clearAttendanceAction}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

export default DeptFingerprintActionsMenu;
