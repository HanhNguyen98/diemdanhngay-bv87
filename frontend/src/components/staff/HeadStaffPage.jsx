import { useMemo } from 'react';
import HeadAppShell from '../layout/HeadAppShell';
import HeadPageHeader from '../layout/HeadPageHeader';
import MobileHeadBreadcrumb from '../layout/MobileHeadBreadcrumb';
import NotificationBell from '../shared/NotificationBell';
import { UI } from '../../constants/attendance';
import {
  HEAD_MOBILE_BREADCRUMB_CLASS,
  HEAD_SCROLL_MAIN_CLASS,
  buildHeadBreadcrumb,
} from '../../constants/headLayout';
import StaffPage from './StaffPage';

export default function HeadStaffPage({ user, onLogout, activeNav, onNavChange }) {
  const deptName = user?.deptName || '';
  const mobileTopActions = <NotificationBell variant="attendance" />;

  const breadcrumb = useMemo(
    () => buildHeadBreadcrumb(UI.headStaff, deptName),
    [deptName],
  );

  return (
    <HeadAppShell
      user={user}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
      mobileTopActions={mobileTopActions}
    >
      <div className="hidden lg:block shrink-0">
        <HeadPageHeader breadcrumb={breadcrumb} />
      </div>

      <div className={HEAD_MOBILE_BREADCRUMB_CLASS}>
        <MobileHeadBreadcrumb items={breadcrumb} />
      </div>

      <main className={HEAD_SCROLL_MAIN_CLASS}>
        <StaffPage mode="head" />
      </main>
    </HeadAppShell>
  );
}
