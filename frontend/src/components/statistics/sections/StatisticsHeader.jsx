import { useMemo } from 'react';
import { UI } from '../../../constants/attendance';
import { buildHeadBreadcrumb } from '../../../constants/headLayout';
import HeadPageHeader from '../../layout/HeadPageHeader';

export default function StatisticsHeader({ deptName }) {
  const breadcrumb = useMemo(
    () => buildHeadBreadcrumb(UI.breadcrumbStatistics, deptName),
    [deptName],
  );

  return <HeadPageHeader breadcrumb={breadcrumb} />;
}
