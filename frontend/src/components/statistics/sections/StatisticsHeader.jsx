import { useMemo } from 'react';
import { UI } from '../../../constants/attendance';
import HeadPageHeader from '../../layout/HeadPageHeader';

export default function StatisticsHeader() {
  const breadcrumb = useMemo(
    () => [{ label: UI.breadcrumbSystem }, { label: UI.breadcrumbStatistics }],
    [],
  );

  return <HeadPageHeader breadcrumb={breadcrumb} />;
}
