import { memo, useMemo } from 'react';
import { STATISTICS_UI } from '../../../constants/attendance';
import { useAttendanceStatusConfig } from '../../../context/AttendanceStatusContext';
import { mergeBreakdownWithCatalog } from '../../../utils/statusBreakdown';
import StatusBreakdownKpiGrid from '../../shared/StatusBreakdownKpiGrid';

const StatisticsKpiCards = memo(function StatisticsKpiCards({ statusBreakdown }) {
  const { items: catalogItems } = useAttendanceStatusConfig();

  const items = useMemo(
    () => mergeBreakdownWithCatalog(statusBreakdown, catalogItems),
    [statusBreakdown, catalogItems],
  );

  return (
    <StatusBreakdownKpiGrid
      statusBreakdown={items}
      className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 min-h-[9.5rem]"
      unit={STATISTICS_UI.kpiUnit}
    />
  );
});

export default StatisticsKpiCards;
