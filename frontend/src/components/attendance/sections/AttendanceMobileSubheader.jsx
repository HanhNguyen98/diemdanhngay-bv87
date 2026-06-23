import { memo, useMemo } from 'react';
import { UI } from '../../../constants/attendance';
import { HEAD_MOBILE_BREADCRUMB_CLASS, buildHeadBreadcrumb } from '../../../constants/headLayout';
import MobileHeadBreadcrumb from '../../layout/MobileHeadBreadcrumb';

const AttendanceMobileSubheader = memo(function AttendanceMobileSubheader({ deptName }) {
  const breadcrumbItems = useMemo(
    () => buildHeadBreadcrumb(UI.breadcrumbAttendance, deptName),
    [deptName],
  );

  return (
    <div className={HEAD_MOBILE_BREADCRUMB_CLASS}>
      <MobileHeadBreadcrumb items={breadcrumbItems} />
    </div>
  );
});

export default AttendanceMobileSubheader;
