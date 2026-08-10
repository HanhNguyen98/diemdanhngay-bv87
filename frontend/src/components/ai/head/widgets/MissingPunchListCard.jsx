import { HEAD_AI_ASSISTANT_UI } from '../../../../constants/headAiAssistant';

export default function MissingPunchListCard({ payload }) {
  const items = payload?.items || [];
  const w = HEAD_AI_ASSISTANT_UI.widgets;

  if (items.length === 0) {
    return <p className="mt-2 text-sm text-content-muted">{w.missingPunchEmpty}</p>;
  }

  return (
    <div className="mt-2 rounded-xl border border-line bg-surface-white overflow-hidden shadow-sm">
      <div className="px-3 py-2 border-b border-line bg-surface-page/60">
        <p className="text-sm font-semibold text-navy">{w.missingPunchTitle}</p>
        <p className="text-xs text-content-muted">{payload?.dateFormatted}</p>
      </div>
      <ul className="max-h-48 overflow-y-auto divide-y divide-line">
        {items.map((row) => (
          <li
            key={`${row.empCode}-${row.reason}`}
            className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
          >
            <span className="text-navy min-w-0 truncate">
              [{row.empCodeFormatted}] {row.fullName}
            </span>
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 ${
                row.reason === 'MISSING_CHECK_OUT'
                  ? 'bg-warning text-warning-fg'
                  : 'bg-neutral text-neutral-fg'
              }`}
            >
              {row.reasonLabel
                || (row.reason === 'MISSING_CHECK_OUT' ? w.missingPunchCheckout : w.missingPunchUnmarked)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
