import { useMemo } from 'react';
import { UI } from '../../constants/attendance';
import HeadAppShell from '../layout/HeadAppShell';
import HeadPageHeader from '../layout/HeadPageHeader';
import MobileHeadBreadcrumb from '../layout/MobileHeadBreadcrumb';
import ChangePasswordForm from './ChangePasswordForm';

export default function ChangePasswordPage({ user, onLogout, activeNav, onNavChange }) {
  const breadcrumb = useMemo(
    () => [{ label: UI.breadcrumbSystem }, { label: UI.changePassword }],
    [],
  );

  return (
    <HeadAppShell
      user={user}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
    >
      <div className="hidden lg:block shrink-0">
        <HeadPageHeader breadcrumb={breadcrumb} />
      </div>

      <div className="lg:hidden shrink-0 border-b border-line px-[clamp(0.75rem,3vw,1.25rem)] py-2.5">
        <MobileHeadBreadcrumb items={breadcrumb} />
      </div>

      <main className="px-[clamp(0.75rem,3vw,1.25rem)] py-[clamp(0.75rem,2vw,1rem)] lg:flex lg:flex-col lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:p-5">
        <div className="max-w-md mx-auto w-full">
          <ChangePasswordForm />
        </div>
      </main>
    </HeadAppShell>
  );
}
