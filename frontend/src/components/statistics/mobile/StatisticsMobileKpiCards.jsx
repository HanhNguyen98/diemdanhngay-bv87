import { memo, useMemo } from 'react';
import AttendanceStatusTileGrid from '../../attendance/sections/AttendanceStatusTileGrid';
import { useAttendanceStatusConfig } from '../../../context/AttendanceStatusContext';
import { mergeBreakdownWithCatalog } from '../../../utils/statusBreakdown';

const StatisticsMobileKpiCards = memo(function StatisticsMobileKpiCards({ statusBreakdown }) {
  const { items: catalogItems } = useAttendanceStatusConfig();

  const items = useMemo(
    () => mergeBreakdownWithCatalog(statusBreakdown, catalogItems),
    [statusBreakdown, catalogItems],
  );

  return <AttendanceStatusTileGrid statusBreakdown={items} scroll />;
});

export default StatisticsMobileKpiCards;
