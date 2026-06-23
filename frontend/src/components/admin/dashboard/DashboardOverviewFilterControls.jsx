import { memo } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { STATISTICS_UI } from '../../../constants/attendance';
import { useAdminDashboardContext } from '../../../context/AdminDashboardContext';
import StaffDeptFilter from '../../staff/StaffDeptFilter';
import MobileFilterInputRow from '../sections/MobileFilterInputRow';

const RESET_BTN_CLASS =
  'inline-flex shrink-0 items-center justify-center rounded-lg border border-line bg-surface-white text-content-muted hover:bg-neutral transition-colors disabled:opacity-60';

const APPLY_BTN_CLASS =
  'inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-60';

const DashboardOverviewFilterControls = memo(function DashboardOverviewFilterControls({
  variant = 'desktop',
}) {
  const ctx = useAdminDashboardContext();
  if (!ctx) return null;

  const {
    departmentFilterOptions,
    deptFilterDraft,
    patchDeptFilterDraft,
    applyDeptFilter,
    resetDeptFilter,
    refreshing,
  } = ctx;

  const applyLabel = STATISTICS_UI.applyFilter;
  const resetLabel = ADMIN_UI.resetFilters;
  const disabled = refreshing;
  const departments = departmentFilterOptions;

  if (variant === 'mobile') {
    return (
      <MobileFilterInputRow onApply={applyDeptFilter} onReset={resetDeptFilter} disabled={disabled}>
        <StaffDeptFilter
          departments={departments}
          value={deptFilterDraft}
          onChange={(dept) => patchDeptFilterDraft({ dept })}
          disabled={disabled || !departments.length}
          className="w-full"
        />
      </MobileFilterInputRow>
    );
  }

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <StaffDeptFilter
        departments={departments}
        value={deptFilterDraft}
        onChange={(dept) => patchDeptFilterDraft({ dept })}
        disabled={disabled || !departments.length}
        className="w-[220px] shrink-0"
      />
      <button
        type="button"
        onClick={applyDeptFilter}
        disabled={disabled}
        className={`${APPLY_BTN_CLASS} h-8 w-8`}
        title={applyLabel}
        aria-label={applyLabel}
      >
        <Search className="w-4 h-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={resetDeptFilter}
        disabled={disabled}
        className={`${RESET_BTN_CLASS} h-8 w-8`}
        title={resetLabel}
        aria-label={resetLabel}
      >
        <RotateCcw className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
});

export default DashboardOverviewFilterControls;
