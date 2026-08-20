import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Lock, LockOpen, ShieldOff, ShieldCheck } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';

const MENU_MIN_WIDTH = 200;
const MENU_EST_HEIGHT = 88;
const VIEWPORT_PAD = 8;

function resolveLockMenuItem(dept, labels, lockLoading) {
  const isLocked = dept.locked && !dept.unlocked;

  if (lockLoading) {
    return {
      label: labels.lockStatusProcessing,
      disabled: true,
      icon: isLocked ? Lock : LockOpen,
    };
  }

  if (isLocked) {
    return {
      label: labels.menuActionUnlockDept,
      disabled: false,
      icon: LockOpen,
      hint: dept.manualLocked ? labels.lockStatusManualLocked : labels.lockStatusLocked,
    };
  }

  return {
    label: labels.menuActionLockDept,
    disabled: false,
    icon: Lock,
    hint: dept.unlocked ? labels.lockStatusUnlocked : labels.lockStatusOpen,
  };
}

function resolveHeadEditMenuItem(dept, labels, reportLoading) {
  if (dept.reportSubmitted) {
    return {
      label: labels.menuActionLegacyReport,
      disabled: true,
      icon: ShieldCheck,
      hint: labels.reportStatusSubmitted,
    };
  }

  if (reportLoading) {
    return {
      label: labels.reportStatusProcessing,
      disabled: true,
      icon: dept.reportBlocked ? ShieldOff : ShieldCheck,
    };
  }

  if (dept.reportBlocked) {
    return {
      label: labels.menuActionUnblockHeadEdit,
      disabled: false,
      icon: ShieldCheck,
      hint: labels.reportStatusBlocked,
      danger: false,
    };
  }

  return {
    label: labels.menuActionBlockHeadEdit,
    disabled: false,
    icon: ShieldOff,
    hint: labels.reportStatusOpen,
    danger: true,
  };
}

/** Dashboard row actions — SPEC_ADMIN §6.2 P6-DashActions. */
const DeptRowActions = memo(function DeptRowActions({
  dept,
  onToggleLock,
  onToggleReportBlock,
  lockLoading = false,
  reportLoading = false,
  compact = false,
}) {
  const { dashboard: d } = ADMIN_UI;
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const lockItem = useMemo(
    () => resolveLockMenuItem(dept, d, lockLoading),
    [dept, d, lockLoading],
  );
  const headEditItem = useMemo(
    () => resolveHeadEditMenuItem(dept, d, reportLoading),
    [dept, d, reportLoading],
  );

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
  }, [open, updateMenuPosition, lockItem.label, headEditItem.label]);

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

  const runLock = () => {
    if (lockItem.disabled) return;
    close();
    onToggleLock(dept);
  };

  const runHeadEdit = () => {
    if (headEditItem.disabled) return;
    close();
    onToggleReportBlock(dept);
  };

  const btnClass = compact
    ? 'inline-flex items-center justify-center gap-0.5 whitespace-nowrap rounded-md border border-line bg-surface-white px-1.5 py-0.5 text-3xs font-semibold text-primary hover:bg-primary-light'
    : 'inline-flex items-center justify-center gap-1 whitespace-nowrap min-w-[5.25rem] rounded-lg border border-line bg-surface-white px-2 py-1 text-xs font-semibold text-primary hover:bg-primary-light';

  const itemClass =
    'flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-navy hover:bg-primary-light transition-colors disabled:opacity-50 disabled:pointer-events-none';
  const dangerItemClass =
    'flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-danger-fg hover:bg-danger transition-colors disabled:opacity-50 disabled:pointer-events-none';

  const LockIcon = lockItem.icon;
  const HeadEditIcon = headEditItem.icon;
  const iconSize = compact ? 'w-3 h-3' : 'w-3.5 h-3.5';

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
          disabled={lockItem.disabled}
          title={lockItem.hint}
          onClick={runLock}
        >
          <LockIcon className={`${iconSize} shrink-0`} aria-hidden="true" />
          <span>{lockItem.label}</span>
        </button>
        <button
          type="button"
          role="menuitem"
          className={headEditItem.danger ? dangerItemClass : itemClass}
          disabled={headEditItem.disabled}
          title={headEditItem.hint}
          onClick={runHeadEdit}
        >
          <HeadEditIcon className={`${iconSize} shrink-0`} aria-hidden="true" />
          <span>{headEditItem.label}</span>
        </button>
      </div>
    ) : null;

  return (
    <>
      <div ref={triggerRef}>
        <button
          type="button"
          className={btnClass}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-label={d.progressActionsMenuAria}
          onClick={toggleMenu}
        >
          <span>{d.progressActionsMenu}</span>
          <ChevronDown
            className={`${iconSize} transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>
      {menuPanel ? createPortal(menuPanel, document.body) : null}
    </>
  );
});

export default DeptRowActions;
