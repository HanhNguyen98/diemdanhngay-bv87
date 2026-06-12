import HeadAppShell from '../layout/HeadAppShell';
import HeadPageHeader from '../layout/HeadPageHeader';
import MobileHeadBreadcrumb from '../layout/MobileHeadBreadcrumb';
import SubmenuBreadcrumb from '../admin/sections/SubmenuBreadcrumb';
import { UI } from '../../constants/attendance';
import StaffPage from './StaffPage';

export default function HeadStaffPage({ user, onLogout, activeNav, onNavChange }) {
  return (
    <HeadAppShell
      user={user}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
    >
      <div className="hidden lg:block shrink-0">
        <HeadPageHeader
          breadcrumbSlot={
            <SubmenuBreadcrumb parent={UI.breadcrumbCatalog} current={UI.headStaff} />
          }
        />
      </div>

      <div className="lg:hidden shrink-0 border-b border-line px-[clamp(0.75rem,3vw,1.25rem)] py-2.5">
        <MobileHeadBreadcrumb
          items={[{ label: UI.breadcrumbCatalog }, { label: UI.headStaff }]}
        />
      </div>

      <main className="px-[clamp(0.75rem,3vw,1.25rem)] py-[clamp(0.75rem,2vw,1rem)] max-lg:pb-8 lg:flex lg:flex-col lg:flex-1 lg:min-h-0 lg:overflow-hidden lg:p-6">
        <StaffPage mode="head" />
      </main>
    </HeadAppShell>
  );
}
