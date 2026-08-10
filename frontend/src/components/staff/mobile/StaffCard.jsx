import { memo } from 'react';
import { Award, Building2, Camera, Fingerprint, History, Pencil, Trash2 } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { getInitials } from '../../../utils/formatters';

const { staff: s } = ADMIN_UI;

function StaffAvatarBlock({ staff, showCamera, onAvatarClick }) {
  return (
    <div className="relative shrink-0">
      {staff.avatarUrl ? (
        <img
          src={staff.avatarUrl}
          alt=""
          className="w-16 h-16 rounded-xl object-cover ring-2 ring-white shadow-sm"
        />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-primary-light text-primary text-sm font-bold flex items-center justify-center ring-2 ring-white shadow-sm">
          {getInitials(staff.fullname)}
        </div>
      )}
      {showCamera && onAvatarClick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAvatarClick();
          }}
          className="absolute -bottom-1 -right-1 z-10 w-7 h-7 rounded-full bg-primary text-white border-2 border-white shadow-sm flex items-center justify-center hover:bg-primary-hover transition-colors"
          aria-label={s.mobile.changeAvatar}
        >
          <Camera className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function StatusBadge({ active }) {
  const label = active ? s.active : s.inactive;
  return (
    <span
      className={`inline-flex max-w-full truncate rounded-full px-1.5 py-px text-4xs font-semibold leading-tight ${
        active ? 'badge-success' : 'badge-neutral'
      }`}
    >
      {label}
    </span>
  );
}

function FingerprintBadge({ registered, fingerLabel }) {
  const label = registered
    ? fingerLabel || s.fingerprintRegistered
    : s.fingerprintMissing;
  const title =
    registered && fingerLabel
      ? `${s.fingerprintRegistered} — ${fingerLabel}`
      : undefined;
  return (
    <span
      title={title}
      className={`inline-flex min-w-0 max-w-full truncate rounded-full px-1.5 py-px text-4xs font-semibold leading-tight ${
        registered ? 'badge-success' : 'badge-neutral'
      }`}
    >
      {label}
    </span>
  );
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-surface-white border border-line flex items-center justify-center shrink-0 text-content-muted">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-4xs font-bold text-content-muted uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-800 font-medium leading-snug mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

const StaffCard = memo(function StaffCard({
  staff,
  onEdit,
  onDelete,
  onHistory,
  onDeleteFingerprint,
  avatarOnly = false,
  hideDeptColumn = false,
}) {
  const active = staff.active !== false;
  const registered = Boolean(staff.fingerprintRegistered);
  const deptDisplay = `[${staff.deptCodeFormatted}] ${staff.deptName}`;
  const showFpDelete = registered && onDeleteFingerprint;
  const footerActions = [
    !avatarOnly,
    !avatarOnly && onHistory,
    showFpDelete,
    !avatarOnly && onDelete,
  ].filter(Boolean).length;

  return (
    <article className="flex flex-col divide-y divide-line border border-line rounded-2xl bg-surface-white shadow-card overflow-hidden">
      <div className="p-4">
        <div className="flex gap-3">
          <StaffAvatarBlock
            staff={staff}
            showCamera={avatarOnly}
            onAvatarClick={avatarOnly ? () => onEdit(staff) : undefined}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-gray-800 leading-snug line-clamp-2 min-w-0">
                {staff.fullname}
              </h3>
              <span className="shrink-0 bg-primary-light text-primary font-semibold px-2 py-0.5 rounded text-3xs tabular-nums">
                {staff.empCodeFormatted}
              </span>
            </div>
            <p className="text-sm text-content-muted mt-0.5 truncate">
              {staff.positionName || '—'}
            </p>
            <div className="mt-1.5 flex min-w-0 flex-wrap gap-1">
              <StatusBadge active={active} />
              <FingerprintBadge registered={registered} fingerLabel={staff.fingerLabel} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-table-header/60 space-y-3">
        {!hideDeptColumn && (
          <MetaRow icon={Building2} label={s.mobile.deptLabel} value={deptDisplay} />
        )}
        <MetaRow icon={Award} label={s.mobile.rankLabel} value={staff.rankName || '—'} />
      </div>

      {footerActions > 0 && (
        <div
          className={`grid ${
            footerActions >= 3 ? 'grid-cols-3' : footerActions === 2 ? 'grid-cols-2' : 'grid-cols-1'
          } divide-x divide-line py-3`}
        >
          {!avatarOnly && (
            <button
              type="button"
              onClick={() => onEdit(staff)}
              className="flex flex-col items-center gap-1 text-4xs font-bold tracking-wide text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              {s.mobile.edit}
            </button>
          )}
          {!avatarOnly && onHistory && (
            <button
              type="button"
              onClick={() => onHistory(staff)}
              className="flex flex-col items-center gap-1 text-4xs font-bold tracking-wide text-info-fg hover:text-primary transition-colors"
            >
              <History className="w-4 h-4" />
              {s.transferHistoryView}
            </button>
          )}
          {showFpDelete && (
            <button
              type="button"
              onClick={() => onDeleteFingerprint(staff)}
              className="flex flex-col items-center gap-1 text-4xs font-bold tracking-wide text-warning-fg hover:text-navy transition-colors"
            >
              <Fingerprint className="w-4 h-4" />
              {s.fingerprintDeleteLabel}
            </button>
          )}
          {!avatarOnly && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(staff)}
              className="flex flex-col items-center gap-1 text-4xs font-bold tracking-wide text-danger-fg hover:text-danger-dark transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {s.mobile.delete}
            </button>
          )}
        </div>
      )}
    </article>
  );
});

export default StaffCard;
