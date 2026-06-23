import { memo, cloneElement, isValidElement, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import { STATISTICS_UI } from '../../constants/attendance';
import { useFilterDraft } from '../../hooks/useFilterDraft';
import RegistrySearchInput from '../admin/sections/RegistrySearchInput';
import MobileFilterInputRow from '../admin/sections/MobileFilterInputRow';
import TextSearchInput from '../shared/TextSearchInput';
import StaffDeptFilter from './StaffDeptFilter';

const ADD_BTN_CLASS =
  'inline-flex items-center justify-center gap-1 h-9 btn-primary px-2.5 lg:px-3 rounded-lg text-xs lg:text-sm shadow-sm whitespace-nowrap min-w-0';

const MOBILE_SEARCH_INPUT_CLASS =
  'h-9 pl-3 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white hover:bg-neutral outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors';

const searchInputProps = (search, onSearchChange, loading, onReset) => ({
  value: search,
  onChange: onSearchChange,
  placeholder: ADMIN_UI.searchPlaceholderStaff,
  withApplyButton: true,
  showDesktopApplyLabel: true,
  applyLabel: STATISTICS_UI.applyFilter,
  disabled: loading,
  onReset,
});

function ActionButtons({ onAdd, excelControl, newButtonLabel }) {
  return (
    <>
      <div className="flex items-center gap-2 w-full min-w-0 lg:hidden">
        <button type="button" onClick={onAdd} className={`${ADD_BTN_CLASS} flex-1`}>
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{newButtonLabel}</span>
        </button>
        {excelControl && (
          <div className="shrink-0">
            {isValidElement(excelControl)
              ? cloneElement(excelControl, { compact: true })
              : excelControl}
          </div>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-2 shrink-0 lg:ml-auto">
        <button type="button" onClick={onAdd} className={`${ADD_BTN_CLASS} lg:flex-initial`}>
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{newButtonLabel}</span>
        </button>
        {excelControl && <div className="shrink-0">{excelControl}</div>}
      </div>
    </>
  );
}

const StaffFilterBar = memo(function StaffFilterBar({
  isHead = false,
  departments,
  deptFilter,
  onDeptFilterChange,
  search,
  onSearchChange,
  onAdd,
  excelControl,
  onResetFilters,
  loading = false,
}) {
  const s = ADMIN_UI.staff;
  const searchProps = searchInputProps(search, onSearchChange, loading, onResetFilters);
  const applied = { dept: deptFilter, search };
  const { draft, patchDraft } = useFilterDraft(applied);

  const applyMobileFilters = useCallback(() => {
    onDeptFilterChange(draft.dept);
    onSearchChange(draft.search);
  }, [draft.dept, draft.search, onDeptFilterChange, onSearchChange]);

  if (isHead) {
    return (
      <RegistrySearchInput
        {...searchProps}
        widthClass="w-full lg:flex-1 lg:min-w-[12rem] lg:max-w-md"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <div className="flex flex-col gap-2 lg:hidden">
        <StaffDeptFilter
          departments={departments}
          value={draft.dept}
          onChange={(dept) => patchDraft({ dept })}
          className="w-full"
        />
        <MobileFilterInputRow
          onApply={applyMobileFilters}
          onReset={onResetFilters}
          disabled={loading}
        >
          <TextSearchInput
            value={draft.search}
            onChange={(value) => patchDraft({ search: value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyMobileFilters();
            }}
            placeholder={ADMIN_UI.searchPlaceholderStaff}
            widthClass="w-full"
            inputClassName={MOBILE_SEARCH_INPUT_CLASS}
            showSearchIcon={false}
          />
        </MobileFilterInputRow>
        <ActionButtons onAdd={onAdd} excelControl={excelControl} newButtonLabel={s.newButton} />
      </div>

      <div className="hidden lg:flex lg:items-center lg:gap-2 w-full min-w-0">
        <StaffDeptFilter
          departments={departments}
          value={deptFilter}
          onChange={onDeptFilterChange}
          className="w-[220px] shrink-0"
        />
        <RegistrySearchInput
          {...searchProps}
          widthClass="flex-1 min-w-[12rem] max-w-md"
        />
        <ActionButtons onAdd={onAdd} excelControl={excelControl} newButtonLabel={s.newButton} />
      </div>
    </div>
  );
});

export default StaffFilterBar;
