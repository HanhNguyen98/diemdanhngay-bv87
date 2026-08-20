import { memo, useMemo } from 'react';
import { STATISTICS_UI } from '../../../constants/attendance';
import { useAttendanceStatusConfig } from '../../../context/AttendanceStatusContext';
import { mergeBreakdownWithCatalog } from '../../../utils/statusBreakdown';
import StatusBreakdownKpiGrid from '../../shared/StatusBreakdownKpiGrid';

/** Desktop status KPI — P6-StatusKpi5Col (SPEC_HEAD §7.2 / SPEC_FINGERPRINT §10.5). */
const DESKTOP_STATUS_GRID_CLASS =
  'hidden lg:grid lg:grid-cols-5 gap-1.5';

const StatisticsKpiCards = memo(function StatisticsKpiCards({ statusBreakdown }) {
  const { items: catalogItems } = useAttendanceStatusConfig();

  const items = useMemo(
    () => mergeBreakdownWithCatalog(statusBreakdown, catalogItems),
    [statusBreakdown, catalogItems],
  );

  return (
    <StatusBreakdownKpiGrid
      statusBreakdown={items}
      className={DESKTOP_STATUS_GRID_CLASS}
      unit={STATISTICS_UI.kpiUnit}
      compact
    />
  );
});

export default StatisticsKpiCards;
