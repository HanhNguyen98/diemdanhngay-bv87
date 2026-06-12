import { memo } from 'react';
import { STATISTICS_UI, UI } from '../../../constants/attendance';
import MobilePagination from '../../shared/MobilePagination';
import AttendanceHistoryCard from './AttendanceHistoryCard';

const AttendanceHistoryCardList = memo(function AttendanceHistoryCardList({
  items,
  totalItems,
  deptName,
  loading,
  page,
  totalPages,
  onPageChange,
}) {
  return (
    <section className="lg:hidden" aria-label={STATISTICS_UI.mobileHistoryTitle}>
      <div className="flex items-baseline justify-between gap-2 mb-3 pt-1">
        <h2 className="text-sm font-bold text-content-heading">{STATISTICS_UI.mobileHistoryTitle}</h2>
        {!loading && (
          <span className="text-4xs text-content-muted shrink-0">
            {STATISTICS_UI.mobileResultsCount(totalItems)}
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-content-muted text-sm animate-pulse">{UI.loading}</div>
      ) : !items?.length ? (
        <div className="py-16 text-center text-content-muted text-sm">{STATISTICS_UI.noHistory}</div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <AttendanceHistoryCard key={item.recordId} item={item} deptName={deptName} />
            ))}
          </div>
          <MobilePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={onPageChange}
          />
        </>
      )}
    </section>
  );
});

export default AttendanceHistoryCardList;
