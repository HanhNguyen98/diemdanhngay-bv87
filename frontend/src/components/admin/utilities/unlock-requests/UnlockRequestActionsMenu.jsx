import { memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { ADMIN_UI } from '../../../../constants/admin';

const MENU_MIN_WIDTH = 148;
const MENU_EST_HEIGHT = 88;
const VIEWPORT_PAD = 8;

/**
 * Compact dropdown for unlock-request row actions — SPEC P15 §4.7.2.
 * Portal so RegistryTableShell overflow does not clip the menu.
 */
const UnlockRequestActionsMenu = memo(function UnlockRequestActionsMenu({
  onApprove,
  onReject,
}) {
  const d = ADMIN_UI.dashboard;
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

    let left = rect.right - menuWidth;
    left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - menuWidth - VIEWPORT_PAD));

    setMenuStyle({ top, left, minWidth: MENU_MIN_WIDTH });
  }, []);

  const openMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setMenuStyle({
      top: rect.bottom + 4,
      left: Math.max(VIEWPORT_PAD, rect.right - MENU_MIN_WIDTH),
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
  }, [open, updateMenuPosition]);

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
          onClick={() => run(onApprove)}
        >
          {d.unlockRequestsApprove}
        </button>
        <button
          type="button"
          role="menuitem"
          className={dangerItemClass}
          onClick={() => run(onReject)}
        >
          {d.unlockRequestsReject}
        </button>
      </div>
    ) : null;

  return (
    <>
      <div className="relative inline-flex" ref={triggerRef}>
        <button
          type="button"
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-line bg-surface-white px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary-light"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-label={d.unlockRequestsActionsMenuAria}
          onClick={toggleMenu}
        >
          <span>{d.unlockRequestsActionsMenu}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>
      {menuPanel ? createPortal(menuPanel, document.body) : null}
    </>
  );
});

export default UnlockRequestActionsMenu;
