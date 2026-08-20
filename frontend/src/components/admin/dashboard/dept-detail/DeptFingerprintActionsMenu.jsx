import { memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Fingerprint } from 'lucide-react';
import { ADMIN_UI } from '../../../../constants/admin';

const MENU_MIN_WIDTH = 176;
const MENU_EST_HEIGHT = 132;
const VIEWPORT_PAD = 8;

/**
 * Compact dropdown for fingerprint-related Admin actions — SPEC §10.6 / P3g.
 * Menu uses a portal so mobile card overflow does not clip it.
 */
const DeptFingerprintActionsMenu = memo(function DeptFingerprintActionsMenu({
  canFillTimes,
  canApprovePayrollFill,
  canClear,
  onOpenScanLogs,
  onFillTimes,
  onApprovePayrollFill,
  onClearAttendance,
  compact = false,
}) {
  const { dashboard: d } = ADMIN_UI;
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setMenuStyle(null);
  }, []);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? MENU_EST_HEIGHT;
    const menuWidth = menuRef.current?.offsetWidth ?? MENU_MIN_WIDTH;
    const gap = 4;

    let top = rect.bottom + gap;
    if (top + menuHeight > window.innerHeight - VIEWPORT_PAD) {
      top = Math.max(VIEWPORT_PAD, rect.top - menuHeight - gap);
    }

    let left = rect.left;
    left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - menuWidth - VIEWPORT_PAD));

    setMenuStyle({ top, left, minWidth: MENU_MIN_WIDTH });
  }, []);

  const openMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setMenuStyle({
      top: rect.bottom + 4,
      left: Math.max(VIEWPORT_PAD, rect.left),
      minWidth: MENU_MIN_WIDTH,
    });
    setOpen(true);
  }, []);

  const toggleMenu = useCallback(() => {
    if (open) {
      close();
    } else {
      openMenu();
    }
  }, [open, close, openMenu]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    updateMenuPosition();
    const menu = menuRef.current;
    if (!menu) return undefined;
    const ro = new ResizeObserver(() => updateMenuPosition());
    ro.observe(menu);
    return () => ro.disconnect();
  }, [open, updateMenuPosition, canFillTimes, canApprovePayrollFill, canClear]);

  useEffect(() => {
    if (!open) return undefined;
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      const target = e.target;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      close();
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
    'block w-full text-left px-3 py-2 text-xs font-medium text-navy hover:bg-primary-light transition-colors';
  const dangerItemClass =
    'block w-full text-left px-3 py-2 text-xs font-medium text-danger-fg hover:bg-danger transition-colors';

  const menuPanel =
    open && menuStyle ? (
      <div
        id={menuId}
        ref={menuRef}
        role="menu"
        style={{
          position: 'fixed',
          top: menuStyle.top,
          left: menuStyle.left,
          minWidth: menuStyle.minWidth,
          zIndex: 60,
        }}
        className="rounded-lg border border-line bg-surface-white py-1 shadow-card"
      >
        <button
          type="button"
          role="menuitem"
          className={itemClass}
          onClick={() => run(onOpenScanLogs)}
        >
          {d.deptDetailScanLogs}
        </button>
        {canApprovePayrollFill ? (
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => run(onApprovePayrollFill)}
          >
            {d.payrollFillApproveAction}
          </button>
        ) : null}
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
    ) : null;

  return (
    <>
      <div className="relative inline-flex" ref={triggerRef}>
        <button
          type="button"
          className={btnClass}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-label={d.fingerprintMenuAria}
          onClick={toggleMenu}
        >
          <Fingerprint className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden />
          <span>{d.fingerprintMenu}</span>
          <ChevronDown
            className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>
      {menuPanel ? createPortal(menuPanel, document.body) : null}
    </>
  );
});

export default DeptFingerprintActionsMenu;
