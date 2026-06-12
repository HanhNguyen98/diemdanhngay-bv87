import { lazy, Suspense } from 'react';
import FlashBanner from '../../shared/FlashBanner';
import { ADMIN_UI } from '../../../constants/admin';
import { useAdminDashboardContext } from '../../../context/AdminDashboardContext';
import DashboardKpiBar from './DashboardKpiBar';
import DeptProgressTable from './DeptProgressTable';
import PresenceDonutChart from './PresenceDonutChart';
import ReminderModal from './ReminderModal';

const UnlockModal = lazy(() => import('../../UnlockModal'));

export default function AdminDashboardPage() {
  const ctx = useAdminDashboardContext();
  const {
    loading,
    kpi,
    filteredDepts,
    incompleteDepts,
    reminderOpen,
    setReminderOpen,
    selectedDeptCodes,
    toggleReminderDept,
    toggleReminderAll,
    sendReminders,
    reminderSending,
    unlockTarget,
    setUnlockTarget,
    handleUnlockConfirm,
    blockReport,
    unblockReport,
    actionLoading,
    flash,
    clearFlash,
  } = ctx ?? {};

  const { dashboard: d } = ADMIN_UI;

  if (!ctx || (loading && !kpi)) {
    return (
      <div className="py-24 text-center text-content-muted animate-pulse">{d.loading}</div>
    );
  }

  return (
    <>
      {flash && <FlashBanner flash={flash} onClose={clearFlash} />}

      <div className="h-full min-h-0 overflow-y-auto space-y-6">
        <DashboardKpiBar kpi={kpi} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 min-h-[360px]">
            <DeptProgressTable
              departments={filteredDepts}
              onUnlock={setUnlockTarget}
              onBlockReport={blockReport}
              onUnblockReport={unblockReport}
              actionLoading={actionLoading}
            />
          </div>
          <div className="min-h-[360px]">
            <PresenceDonutChart kpi={kpi} />
          </div>
        </div>
      </div>

      <ReminderModal
        open={reminderOpen}
        incompleteDepts={incompleteDepts}
        selectedDeptCodes={selectedDeptCodes}
        onToggleDept={toggleReminderDept}
        onToggleAll={toggleReminderAll}
        onClose={() => setReminderOpen(false)}
        onSend={sendReminders}
        sending={reminderSending}
      />

      {unlockTarget && (
        <Suspense fallback={null}>
          <UnlockModal
            deptCode={unlockTarget.deptCode}
            deptName={unlockTarget.deptName}
            onConfirm={handleUnlockConfirm}
            onClose={() => setUnlockTarget(null)}
          />
        </Suspense>
      )}
    </>
  );
}
