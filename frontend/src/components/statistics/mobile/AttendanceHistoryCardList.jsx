import { memo } from 'react';
import { Download } from 'lucide-react';
import { STATISTICS_UI, UI } from '../../../constants/attendance';
import RefreshOverlay from '../../shared/RefreshOverlay';
import MobilePagination from '../../shared/MobilePagination';
import AttendanceHistoryCard from './AttendanceHistoryCard';

const AttendanceHistoryCardList = memo(function AttendanceHistoryCardList({
  items,
  totalItems,
  deptName,
  initialLoading,
  refreshing = false,
  page,
  totalPages,
  onPageChange,
  exporting = false,
  onExport,
}) {
  return (
    <section
      className="lg:hidden rounded-xl border border-line bg-surface-white shadow-card overflow-hidden"
      aria-label={STATISTICS_UI.mobileHistoryTitle}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line">
        <h2 className="text-[0.9rem] font-bold text-content-heading min-w-0 truncate">
          {STATISTICS_UI.mobileHistoryTitle}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-4xs text-content-muted font-bold">
            {STATISTICS_UI.mobileResultsCount(totalItems)}
          </span>
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              disabled={exporting || initialLoading || totalItems === 0}
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-line text-4xs font-semibold text-primary hover:bg-neutral bg-surface-white transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              {STATISTICS_UI.exportExcel}
            </button>
          )}
        </div>
      </div>

      {initialLoading ? (
        <div className="py-16 text-center text-content-muted text-sm animate-pulse bg-surface-white">
          {UI.loading}
        </div>
      ) : !items?.length ? (
        <div className="py-16 text-center text-content-muted text-sm bg-surface-white">
          {STATISTICS_UI.noHistory}
        </div>
      ) : (
        <div className="relative">
          {refreshing && <RefreshOverlay />}
          <div className="flex flex-col gap-3 p-3 bg-surface-white">
            {items.map((item) => (
              <AttendanceHistoryCard key={item.recordId} item={item} deptName={deptName} />
            ))}
          </div>
          <MobilePagination
            sticky={false}
            className="border-t border-line py-2 px-3 bg-surface-white"
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </section>
  );
});

export default AttendanceHistoryCardList;
