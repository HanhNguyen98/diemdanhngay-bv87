import { memo } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

function CountBadge({ count }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-danger-fg text-white text-2xs font-bold leading-none flex items-center justify-center ring-2 ring-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

const VARIANT_STYLES = {
  default: {
    button:
      'relative w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-content-muted hover:bg-neutral transition-colors',
    icon: 'w-4 h-4',
  },
  attendance: {
    button:
      'relative w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-slate-500 hover:bg-neutral transition-colors duration-150',
    icon: 'w-5 h-5',
  },
};

const NotificationBell = memo(function NotificationBell({
  enabled = true,
  onAttendanceNavigate,
  onUnlockRequestNavigate,
  badgeStyle = 'count',
  variant = 'default',
  className = '',
  iconClassName,
}) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  const resolvedIconClass = iconClassName || styles.icon;
  const { items, unreadCount, open, loading, rootRef, handleOpen, handleItemClick } =
    useNotifications({ enabled, onAttendanceNavigate, onUnlockRequestNavigate });

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleOpen}
        className={styles.button}
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <Bell className={resolvedIconClass} />
        {badgeStyle === 'count' ? (
          <CountBadge count={unreadCount} />
        ) : (
          unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-danger-fg ring-2 ring-white" />
          )
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-panel z-50">
          <div className="px-3 py-2 border-b border-gray-100 text-xs font-bold text-content-muted uppercase">
            Thông báo
          </div>
          {loading && items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-content-muted">Đang tải...</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-content-muted">Không có thông báo.</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-50 hover:bg-primary-light/40 transition-colors ${
                      !item.read ? 'bg-primary-light/20' : ''
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-800 leading-tight">{item.title}</p>
                    <p className="text-3xs text-content-muted mt-0.5 line-clamp-2">{item.body}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
});

export default NotificationBell;
