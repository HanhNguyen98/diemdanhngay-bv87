import { memo, useMemo } from 'react';
import AttendanceStatusTileGrid, {
  DESKTOP_STATUS_COLUMNS,
} from './AttendanceStatusTileGrid';
import KpiProgressWideBanner from './KpiProgressWideBanner';

const KpiBar = memo(function KpiBar({ markedCount, total, statusBreakdown }) {
  const percent = total > 0 ? Math.round((markedCount / total) * 100) : 0;
  const rateLabel = useMemo(() => {
    if (total <= 0) return '0%';
    const rate = (markedCount / total) * 100;
    return Number.isInteger(rate) ? `${rate}%` : `${rate.toFixed(1)}%`;
  }, [markedCount, total]);

  return (
    <>
      <section className="lg:hidden flex flex-col gap-2.5" aria-label="Tổng hợp Điểm danh">
        <KpiProgressWideBanner
          markedCount={markedCount}
          total={total}
          percent={percent}
          rateLabel={rateLabel}
          compact
        />
        <AttendanceStatusTileGrid statusBreakdown={statusBreakdown} scroll />
      </section>

      <section
        className="hidden lg:flex lg:gap-3 lg:items-stretch w-full"
        aria-label="Tổng hợp Điểm danh"
      >
        <KpiProgressWideBanner
          markedCount={markedCount}
          total={total}
          percent={percent}
          rateLabel={rateLabel}
        />
        <AttendanceStatusTileGrid
          statusBreakdown={statusBreakdown}
          columns={DESKTOP_STATUS_COLUMNS}
        />
      </section>
    </>
  );
});

export default KpiBar;
