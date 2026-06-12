import { memo } from 'react';
import { Send } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { useAdminDashboardContext } from '../../../context/AdminDashboardContext';
import RegistrySearchInput from '../sections/RegistrySearchInput';

const DashboardToolbar = memo(function DashboardToolbar() {
  const ctx = useAdminDashboardContext();
  if (!ctx) return null;

  const { search, setSearch, headerMeta, openReminderModal } = ctx;
  const { dashboard: d } = ADMIN_UI;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={openReminderModal}
        className="inline-flex items-center gap-1.5 h-8 btn-primary px-2.5 rounded-lg text-sm shadow-sm shrink-0"
      >
        <Send className="w-3.5 h-3.5" />
        {d.sendReminder}
      </button>
      <RegistrySearchInput
        value={search}
        onChange={setSearch}
        placeholder={d.searchPlaceholder}
      />
      <span className="text-sm text-content-muted tabular-nums whitespace-nowrap hidden sm:inline">
        {headerMeta.time} | {headerMeta.date}
      </span>
    </div>
  );
});

export default DashboardToolbar;
