import { memo } from 'react';
import { UI } from '../../../constants/attendance';
import { formatDateDMY } from '../../../utils/formatters';
import { IconHistory } from '../../icons/Icons';

const HistoryViewBanner = memo(function HistoryViewBanner({
  selectedDate,
  readOnly = true,
}) {
  return (
    <aside
      role="status"
      aria-live="polite"
      className="flex w-full flex-col gap-1.5 rounded-lg border border-primary/20 bg-primary-light px-3 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
    >
      <div className="flex min-w-0 items-center gap-2">
        <IconHistory
          className="h-3.5 w-3.5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="text-xs leading-tight text-navy">
          <span className="font-bold">{UI.viewingHistoryPrefix} </span>
          <span className="font-semibold tabular-nums">{formatDateDMY(selectedDate)}</span>
          <span className="font-normal">
            {' '}
            {readOnly ? UI.viewingHistorySuffix : UI.viewingHistoryUnlockedSuffix}
          </span>
        </p>
      </div>

      {readOnly && (
        <span className="shrink-0 self-start rounded px-2 py-0.5 text-4xs font-semibold uppercase tracking-wide text-primary bg-white/70 sm:self-center">
          {UI.readOnly}
        </span>
      )}
    </aside>
  );
});

export default HistoryViewBanner;
