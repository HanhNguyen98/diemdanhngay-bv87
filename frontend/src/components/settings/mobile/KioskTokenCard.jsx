import { memo } from 'react';
import { Building2, Calendar, KeyRound, Wifi } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { formatLogDateTimeOrDash } from '../../../utils/reminderHistory';
import KioskTokenActionsMenu from '../KioskTokenActionsMenu';

const t = ADMIN_UI.fingerprintTokens;
const m = t.mobile;

function CopyField({ label, value, copyKey, copiedKey, onCopy, missingLabel, missingHint, copyLabel }) {
  const hasValue = Boolean(value);
  const copyText = copiedKey === copyKey ? t.copied : copyLabel || t.copy;
  return (
    <div className="min-w-0">
      <div className="text-4xs font-semibold text-content-muted uppercase tracking-wide">{label}</div>
      <div className="mt-1 flex items-center gap-2 min-w-0">
        {hasValue ? (
          <>
            <code className="text-xs font-mono text-navy break-all min-w-0 flex-1">{value}</code>
            <button
              type="button"
              className="shrink-0 text-primary font-semibold text-xs"
              onClick={() => onCopy(value, copyKey)}
            >
              {copiedKey === copyKey ? t.copied : copyText}
            </button>
          </>
        ) : (
          <span className="text-xs text-content-muted" title={missingHint}>
            {missingLabel}
          </span>
        )}
      </div>
    </div>
  );
}

const KioskTokenCard = memo(function KioskTokenCard({
  row,
  busy = false,
  copiedKey,
  onCopy,
  onRenameLabel,
  onSetPin,
  onRotate,
  onRevoke,
}) {
  const deptLine = [row.deptCodeFormatted, row.deptName].filter(Boolean).join(' — ');

  return (
    <article className="rounded-xl border border-line bg-surface-white shadow-card overflow-hidden">
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-content-muted min-w-0">
              <Building2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
              <h3 className="text-sm font-bold text-navy leading-snug line-clamp-2">{deptLine || '—'}</h3>
            </div>
            {row.label ? (
              <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral text-content-muted">
                {row.label}
              </span>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`inline-block px-2.5 py-1 rounded-full text-4xs font-semibold ${
                row.active ? 'badge-success' : 'badge-neutral'
              }`}
            >
              {row.active ? t.statusActive : t.statusRevoked}
            </span>
            {row.active ? (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-4xs font-semibold ${
                  row.agentOnline ? 'badge-success' : 'badge-neutral'
                }`}
              >
                <Wifi className="w-3 h-3" aria-hidden />
                {row.agentOnline ? t.agentOnline : t.agentOffline}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-line space-y-3">
          <CopyField
            label={m.fieldToken}
            value={row.active ? row.token : null}
            copyKey={`token-${row.id}`}
            copiedKey={copiedKey}
            onCopy={onCopy}
            missingLabel={t.tokenMissing}
            missingHint={row.active && !row.token ? t.tokenMissingHint : undefined}
          />
          <CopyField
            label={m.fieldPin}
            value={row.active ? row.enrollPin : null}
            copyKey={`pin-${row.id}`}
            copiedKey={copiedKey}
            onCopy={onCopy}
            missingLabel={t.pinMissing}
            missingHint={row.active ? t.pinMissingHint : undefined}
            copyLabel={t.copyPin}
          />
          <div className="flex items-center gap-2 text-xs text-content-muted">
            <Calendar className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
            <span>
              {m.fieldCreated}:{' '}
              <span className="font-medium text-navy tabular-nums">{formatLogDateTimeOrDash(row.createdAt)}</span>
            </span>
          </div>
        </div>
      </div>

      {row.active ? (
        <div className="px-3.5 py-2.5 border-t border-line bg-attendance-search/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-4xs font-semibold text-content-muted uppercase tracking-wide">
            <KeyRound className="w-3.5 h-3.5" aria-hidden />
            {t.colActions}
          </div>
          <KioskTokenActionsMenu
            disabled={busy}
            onRenameLabel={() => onRenameLabel(row)}
            onSetPin={() => onSetPin(row)}
            onRotate={() => onRotate(row)}
            onRevoke={() => onRevoke(row)}
          />
        </div>
      ) : null}
    </article>
  );
});

export default KioskTokenCard;
