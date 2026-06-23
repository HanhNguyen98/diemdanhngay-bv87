import { memo } from 'react';
import { ADMIN_UI } from '../../../../../constants/admin';
import ReminderHistoryCard from './ReminderHistoryCard';

const ReminderHistoryCardList = memo(function ReminderHistoryCardList({ items }) {
  const rows = Array.isArray(items) ? items : [];

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-content-muted">
        {ADMIN_UI.dashboard.reminderHistoryEmpty}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 p-2.5">
      {rows.map((row) => (
        <ReminderHistoryCard key={row.id} row={row} />
      ))}
    </div>
  );
});

export default ReminderHistoryCardList;
