import { memo } from 'react';
import { RefreshCw, Send } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { useAdminDashboardContext } from '../../../context/AdminDashboardContext';
import DashboardOverviewFilterControls from './DashboardOverviewFilterControls';

const DashboardToolbar = memo(function DashboardToolbar() {
  const ctx = useAdminDashboardContext();
  if (!ctx) return null;

  const { headerMeta, openReminderModal, refresh, refreshing } = ctx;
  const { dashboard: d } = ADMIN_UI;

  return (
    <div className="flex flex-wrap items-center gap-1.5 lg:flex-nowrap lg:justify-end min-w-0">
      <button
        type="button"
        onClick={openReminderModal}
        className="inline-flex items-center gap-1.5 h-8 btn-primary px-2.5 rounded-lg text-sm shadow-sm shrink-0"
      >
        <Send className="w-3.5 h-3.5" />
        {d.sendReminder}
      </button>
      <DashboardOverviewFilterControls variant="desktop" />
      <button
        type="button"
        onClick={refresh}
        disabled={refreshing}
        title={d.refreshDashboard}
        aria-label={d.refreshDashboard}
        className="inline-flex items-center justify-center gap-1.5 h-8 shrink-0 px-2.5 rounded-lg border border-line bg-surface-white text-content-muted text-sm leading-none hover:bg-neutral transition-colors disabled:opacity-60"
      >
        <RefreshCw
          className={`size-3.5 shrink-0 translate-y-px ${refreshing ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        <span>{d.refreshDashboard}</span>
      </button>
      <span className="text-sm text-content-muted tabular-nums whitespace-nowrap hidden sm:inline">
        {headerMeta.time} | {headerMeta.date}
      </span>
    </div>
  );
});

export default DashboardToolbar;
