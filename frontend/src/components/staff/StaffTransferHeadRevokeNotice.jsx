import { memo, useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';

const { staff: s } = ADMIN_UI;

const StaffTransferHeadRevokeNotice = memo(function StaffTransferHeadRevokeNotice({
  deptLabel,
  username,
  checked,
  onChange,
}) {
  const [expanded, setExpanded] = useState(false);
  const hintMobile = s.transferHeadRevokeHint(deptLabel, username);
  const hintDesktop = s.transferHeadRevokeHintBody(deptLabel);

  return (
    <div className="rounded-lg border border-info-line bg-info-surface p-4 space-y-3" style={{ backgroundColor: '#DDE9FE' }}>
      <div className="flex gap-3">
        <div
          className="shrink-0 w-8 h-8 rounded-full bg-hospital flex items-center justify-center text-white"
          aria-hidden
        >
          <Info className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-gray-800 leading-snug">
            {s.transferHeadRevokeTitle(deptLabel)}
          </p>

          {username && (
            <p className="text-xs text-content-muted">
              {s.transferHeadRevokeAccountLabel}{' '}
              <span className="inline-flex items-center px-2 py-0.5 rounded border border-line bg-surface-white text-gray-800 text-xs font-mono align-middle">
                {username}
              </span>
            </p>
          )}

          <p className="text-xs text-content-body leading-relaxed sm:hidden">
            {s.transferHeadRevokeSummary(deptLabel)}
          </p>

          <div className="sm:hidden">
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-hospital hover:text-primary"
              aria-expanded={expanded}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                aria-hidden
              />
              {expanded ? s.transferHeadRevokeDetailsHide : s.transferHeadRevokeDetailsToggle}
            </button>
            {expanded && (
              <p className="text-xs text-content-body leading-relaxed mt-2 max-h-28 overflow-y-auto">
                {hintMobile}
              </p>
            )}
          </div>

          <p className="hidden sm:block text-xs text-content-body leading-relaxed">
            {hintDesktop}
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-info-line">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="shrink-0 rounded border-gray-300 text-primary outline-none"
        />
        <span className="text-xs text-gray-700 leading-snug">
          {s.transferHeadRevokeCheckbox}
          <span className="text-danger-fg ml-0.5" aria-hidden="true">
            *
          </span>
        </span>
      </label>
    </div>
  );
});

export default StaffTransferHeadRevokeNotice;
