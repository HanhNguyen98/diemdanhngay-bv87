import { memo } from 'react';
import { Clock, Hand } from 'lucide-react';
import { ADMIN_UI } from '../../../../constants/admin';

const ReminderTypeBadge = memo(function ReminderTypeBadge({ triggerType }) {
  const { dashboard: d } = ADMIN_UI;
  const isAuto = triggerType === 'AUTO';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-3xs font-semibold whitespace-nowrap ${
        isAuto
          ? 'bg-violet-100 text-violet-700'
          : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {isAuto ? <Clock className="w-3 h-3" /> : <Hand className="w-3 h-3" />}
      {isAuto ? d.reminderTriggerAuto : d.reminderTriggerManual}
    </span>
  );
});

export default ReminderTypeBadge;
