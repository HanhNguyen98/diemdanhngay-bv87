import { memo } from 'react';
import { Briefcase, Building2, KeyRound, Pencil, Trash2 } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { getInitials } from '../../../utils/formatters';

const { accounts: a } = ADMIN_UI;
const { mobile: m } = a;

function AccountAvatar({ fullname, active, statusLabel }) {
  return (
    <div className="relative shrink-0" aria-label={statusLabel} title={statusLabel}>
      <div className="w-12 h-12 rounded-xl bg-primary-light text-primary text-sm font-bold flex items-center justify-center ring-2 ring-white shadow-sm">
        {getInitials(fullname)}
      </div>
      <span
        className={`absolute -bottom-1 -right-1 z-10 w-3.5 h-3.5 border-2 border-white rounded-full ${
          active ? 'bg-success-fg' : 'bg-content-muted'
        }`}
        aria-hidden="true"
      />
    </div>
  );
}

function ActiveToggle({ active, disabled, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors border ${
        active ? 'bg-primary border-primary/30' : 'bg-neutral border-line'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-150 ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`}
        aria-hidden="true"
      />
    </button>
  );
}

const AccountCard = memo(function AccountCard({
  account,
  onEdit,
  onDelete,
  onResetPassword,
  onToggleActive,
  toggling = false,
}) {
  const active = account.active !== false;
  const statusLabel = active ? a.active : a.inactive;
  const deptDisplay = account.deptName
    ? `[${account.deptCodeFormatted}] ${account.deptName}`
    : '—';
  const identityLine = [account.username, account.empCodeFormatted].filter(Boolean).join(' • ');

  return (
    <article className="rounded-xl border border-line bg-surface-white shadow-card overflow-hidden">
      <div className="p-3.5">
        <div className="flex items-start gap-3 min-w-0">
          <AccountAvatar fullname={account.fullname} active={active} statusLabel={statusLabel} />

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-800 leading-snug line-clamp-2">
              {account.fullname}
            </h3>

            <div className="mt-1.5 flex items-center justify-between gap-2 min-w-0">
              <p className="text-xs text-primary font-medium tabular-nums truncate min-w-0">
                {identityLine || account.username}
              </p>
              <ActiveToggle
                active={active}
                disabled={toggling}
                onToggle={() => onToggleActive(account)}
                label={statusLabel}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-line space-y-2">
          <div className="flex items-center gap-2 min-w-0 text-sm text-gray-700">
            <Briefcase className="w-4 h-4 text-content-muted shrink-0" strokeWidth={1.5} />
            <span className="truncate">{account.roleLabel || '—'}</span>
          </div>
          <div className="flex items-center gap-2 min-w-0 text-sm text-gray-700">
            <Building2 className="w-4 h-4 text-content-muted shrink-0" strokeWidth={1.5} />
            <span className="truncate">{deptDisplay}</span>
          </div>
        </div>
      </div>

      <div className="px-3.5 py-2.5 border-t border-line bg-attendance-search/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(account)}
            aria-label={m.edit}
            className="w-9 h-9 rounded-lg border border-primary-light bg-primary-light text-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <Pencil className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => onResetPassword(account)}
            aria-label={m.resetPassword}
            className="w-9 h-9 rounded-lg border border-primary-light bg-primary-light text-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <KeyRound className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onDelete(account)}
          aria-label={m.delete}
          className="w-9 h-9 rounded-lg border border-danger/30 bg-danger text-danger-fg flex items-center justify-center hover:bg-danger/80 transition-colors"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </article>
  );
});

export default AccountCard;
