import { memo } from 'react';
import { Clock, Hand } from 'lucide-react';
import { ADMIN_UI } from '../../../../constants/admin';

const ReminderTypeBadge = memo(function ReminderTypeBadge({ triggerType, variant = 'default' }) {
  const { dashboard: d } = ADMIN_UI;
  const isAuto = triggerType === 'AUTO';
  const isPill = variant === 'pill';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap ${
        isPill
          ? 'px-2.5 py-0.5 rounded-full text-4xs uppercase tracking-wide'
          : 'px-2 py-0.5 rounded-md text-3xs'
      } ${
        isAuto ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {isAuto ? <Clock className="w-3 h-3" /> : <Hand className="w-3 h-3" />}
      {isAuto ? d.reminderTriggerAuto : d.reminderTriggerManual}
    </span>
  );
});

export default ReminderTypeBadge;
