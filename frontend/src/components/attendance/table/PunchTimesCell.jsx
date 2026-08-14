import { memo } from 'react';
import { UI } from '../../../constants/attendance';
import { formatInstantHm } from '../../../utils/formatters';

function Slot({ label, value }) {
  return (
    <span className="inline-flex items-baseline gap-0.5 min-w-0">
      <span className="text-3xs font-semibold text-content-muted">{label}</span>
      <span className="tabular-nums text-navy font-medium">{formatInstantHm(value) || UI.emptyCell}</span>
    </span>
  );
}

const PunchTimesCell = memo(function PunchTimesCell({ staff, compact = false }) {
  const wrap = compact ? 'flex flex-wrap gap-x-2 gap-y-0.5 text-3xs' : 'grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs';
  return (
    <div className={wrap}>
      <Slot label={UI.timeMorningIn} value={staff?.morningInAt || staff?.checkInAt} />
      <Slot label={UI.timeNoonOut} value={staff?.noonOutAt} />
      <Slot label={UI.timeAfternoonIn} value={staff?.afternoonInAt} />
      <Slot label={UI.timeAfternoonOut} value={staff?.afternoonOutAt || (!staff?.noonOutAt ? staff?.checkOutAt : null)} />
    </div>
  );
});

export default PunchTimesCell;
