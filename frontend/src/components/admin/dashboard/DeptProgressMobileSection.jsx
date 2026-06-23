import { memo } from 'react';
import { RefreshCw, Send } from 'lucide-react';
import { ADMIN_UI, MOBILE_TABLE_PAGINATION_BAR_CLASS } from '../../../constants/admin';
import { useAdminDashboardContext } from '../../../context/AdminDashboardContext';
import DashboardOverviewFilterControls from './DashboardOverviewFilterControls';
import DeptProgressCardList from './DeptProgressCardList';
import MobilePagination from '../../shared/MobilePagination';

const DeptProgressMobileSection = memo(function DeptProgressMobileSection({
  departments,
  page,
  totalPages,
  totalItems,
  onPageChange,
  onToggleLock,
  onToggleReportBlock,
  isActionPending,
}) {
  const ctx = useAdminDashboardContext();
  const { dashboard: d } = ADMIN_UI;

  if (!ctx) return null;

  const { headerMeta, openReminderModal, refresh, refreshing } = ctx;

  return (
    <section className="bg-surface-white border border-line rounded-xl shadow-card overflow-hidden min-w-0 max-w-full">
      <div className="px-2.5 py-2 border-b border-line space-y-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <h3 className="admin-section-title min-w-0 truncate">{d.progressTitle}</h3>
          <span className="text-4xs text-content-muted tabular-nums whitespace-nowrap shrink-0">
            {headerMeta.time} | {headerMeta.date}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <DashboardOverviewFilterControls variant="mobile" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              title={d.refreshDashboard}
              aria-label={d.refreshDashboard}
              className="inline-flex flex-1 items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-line bg-surface-white text-content-muted text-sm leading-none hover:bg-neutral transition-colors disabled:opacity-60"
            >
              <RefreshCw
                className={`size-3.5 shrink-0 translate-y-px ${refreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{d.refreshDashboard}</span>
            </button>
            <button
              type="button"
              onClick={openReminderModal}
              className="inline-flex flex-1 items-center justify-center gap-1.5 h-9 btn-primary px-3 rounded-lg text-sm font-semibold shadow-sm"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              {d.sendReminder}
            </button>
          </div>
        </div>
      </div>

      <DeptProgressCardList
        departments={departments}
        onToggleLock={onToggleLock}
        onToggleReportBlock={onToggleReportBlock}
        isActionPending={isActionPending}
      />

      <MobilePagination
        sticky={false}
        className={MOBILE_TABLE_PAGINATION_BAR_CLASS}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </section>
  );
});

export default DeptProgressMobileSection;
