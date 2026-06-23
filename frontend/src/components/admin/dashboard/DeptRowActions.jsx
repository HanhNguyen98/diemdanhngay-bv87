import { memo, useMemo } from 'react';
import { Ban, Check, Lock, LockOpen, Send } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';

const LOCKED_CLASS =
  'text-content-muted bg-neutral border-line hover:bg-line/60';
const OPEN_CLASS =
  'text-success-dark bg-success border-success-fg/25 hover:bg-success/80';
const DISABLED_CLASS =
  'text-content-muted bg-neutral border-line opacity-60 cursor-wait';

const REPORT_OPEN_CLASS =
  'text-content-muted bg-surface-white border-line hover:bg-neutral';
const REPORT_BLOCKED_CLASS =
  'text-warning-dark bg-warning border-warning-fg/25 hover:bg-warning/80';
const REPORT_SUBMITTED_CLASS =
  'text-content-muted bg-neutral border-line opacity-50 cursor-not-allowed';

function resolveLockState(dept, labels, lockLoading) {
  const isLocked = dept.locked && !dept.unlocked;

  if (lockLoading) {
    return {
      Icon: isLocked ? Lock : LockOpen,
      label: labels.lockStatusProcessing,
      buttonClass: DISABLED_CLASS,
      canToggle: false,
    };
  }

  if (isLocked) {
    return {
      Icon: Lock,
      label: dept.manualLocked ? labels.lockStatusManualLocked : labels.lockStatusLocked,
      buttonClass: LOCKED_CLASS,
      canToggle: true,
    };
  }

  return {
    Icon: LockOpen,
    label: dept.unlocked ? labels.lockStatusUnlocked : labels.lockStatusOpen,
    buttonClass: OPEN_CLASS,
    canToggle: true,
  };
}

function resolveReportState(dept, labels, reportLoading) {
  if (dept.reportSubmitted) {
    return {
      Icon: Check,
      label: labels.reportStatusSubmitted,
      buttonClass: REPORT_SUBMITTED_CLASS,
      canToggle: false,
    };
  }

  if (reportLoading) {
    return {
      Icon: dept.reportBlocked ? Ban : Send,
      label: labels.reportStatusProcessing,
      buttonClass: DISABLED_CLASS,
      canToggle: false,
    };
  }

  if (dept.reportBlocked) {
    return {
      Icon: Ban,
      label: labels.reportStatusBlocked,
      buttonClass: REPORT_BLOCKED_CLASS,
      canToggle: true,
    };
  }

  return {
    Icon: Send,
    label: labels.reportStatusOpen,
    buttonClass: REPORT_OPEN_CLASS,
    canToggle: true,
  };
}

const DeptRowActions = memo(function DeptRowActions({
  dept,
  onToggleLock,
  onToggleReportBlock,
  lockLoading = false,
  reportLoading = false,
  compact = false,
}) {
  const { dashboard: d } = ADMIN_UI;
  const lockState = useMemo(
    () => resolveLockState(dept, d, lockLoading),
    [dept, d, lockLoading],
  );
  const reportState = useMemo(
    () => resolveReportState(dept, d, reportLoading),
    [dept, d, reportLoading],
  );

  const iconSize = compact ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const buttonSize = compact ? 'w-7 h-7' : 'w-8 h-8';
  const actionButtonClass = (buttonClass, canToggle) =>
    `rounded-lg border flex items-center justify-center transition-colors shrink-0 ${buttonSize} ${buttonClass} disabled:cursor-not-allowed`;

  const { Icon: LockIcon, label: lockLabel, buttonClass: lockButtonClass, canToggle: canToggleLock } =
    lockState;
  const {
    Icon: ReportIcon,
    label: reportLabel,
    buttonClass: reportButtonClass,
    canToggle: canToggleReport,
  } = reportState;

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        disabled={lockLoading || !canToggleLock}
        onClick={() => onToggleLock(dept)}
        title={lockLabel}
        className={actionButtonClass(lockButtonClass, canToggleLock)}
        aria-label={lockLabel}
      >
        <LockIcon className={iconSize} aria-hidden="true" />
      </button>
      <button
        type="button"
        disabled={reportLoading || !canToggleReport}
        onClick={() => onToggleReportBlock(dept)}
        title={reportLabel}
        className={actionButtonClass(reportButtonClass, canToggleReport)}
        aria-label={reportLabel}
      >
        <ReportIcon className={iconSize} aria-hidden="true" />
      </button>
    </div>
  );
});

export default DeptRowActions;
