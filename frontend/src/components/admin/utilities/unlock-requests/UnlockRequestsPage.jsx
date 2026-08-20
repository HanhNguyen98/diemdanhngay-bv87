import { useState } from 'react';
import AdminSubmenuBreadcrumb from '../../sections/AdminSubmenuBreadcrumb';
import InlineErrorBanner from '../../../shared/InlineErrorBanner';
import FlashBanner from '../../../shared/FlashBanner';
import UnlockModal from '../../../UnlockModal';
import { ADMIN_UI } from '../../../../constants/admin';
import { useUnlockRequests } from '../../../../hooks/useUnlockRequests';
import { useFlashMessage } from '../../../../hooks/useFlashMessage';
import { useAdminUnlockRequestCount } from '../../../../context/AdminUnlockRequestCountContext';
import UnlockRequestsTable from './UnlockRequestsTable';
import UnlockRequestsMobileSection from './UnlockRequestsMobileSection';

export default function UnlockRequestsPage() {
  const {
    status,
    setStatus,
    items,
    initialLoading,
    refreshing,
    error,
    approve,
    reject,
  } = useUnlockRequests({ enabled: true });
  const { refreshPendingCount } = useAdminUnlockRequestCount();
  const { flash, showSuccess, showError, clearFlash } = useFlashMessage();
  const [rejectTarget, setRejectTarget] = useState(null);
  const { dashboard: d } = ADMIN_UI;

  const handleApprove = async (row) => {
    try {
      await approve(row.id);
      await refreshPendingCount();
      showSuccess(d.unlockRequestsApproveSuccess);
    } catch (err) {
      showError(err.message);
    }
  };

  const handleReject = async (note) => {
    await reject(rejectTarget.id, note);
    await refreshPendingCount();
    showSuccess(d.unlockRequestsRejectSuccess);
    setRejectTarget(null);
  };

  const tableProps = {
    items,
    status,
    onStatusChange: setStatus,
    initialLoading,
    refreshing,
    onApprove: handleApprove,
    onReject: setRejectTarget,
  };

  return (
    <>
      <AdminSubmenuBreadcrumb parentLabelKey="utilities" currentLabelKey="unlockRequests" />
      {flash && <FlashBanner flash={flash} onClose={clearFlash} />}
      <div className="flex flex-col h-full min-h-0 gap-2 w-full min-w-0 max-w-full">
        <InlineErrorBanner message={error} className="shrink-0" />

        <UnlockRequestsMobileSection {...tableProps} />

        <UnlockRequestsTable
          {...tableProps}
          className="hidden lg:flex flex-1 min-h-0"
        />
      </div>

      {rejectTarget && (
        <UnlockModal
          deptCode={rejectTarget.deptCode}
          deptName={rejectTarget.deptName}
          date={rejectTarget.attendanceDate}
          title={d.unlockRequestsRejectTitle}
          body={d.unlockRequestsRejectHint}
          placeholder={d.unlockRequestsRejectPlaceholder}
          confirmLabel={d.unlockRequestsReject}
          reasonRequired={false}
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </>
  );
}
