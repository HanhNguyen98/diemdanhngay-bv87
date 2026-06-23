import { memo, cloneElement, isValidElement, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import { STATISTICS_UI } from '../../constants/attendance';
import { useFilterDraft } from '../../hooks/useFilterDraft';
import RegistrySearchInput from '../admin/sections/RegistrySearchInput';
import MobileFilterInputRow from '../admin/sections/MobileFilterInputRow';
import TextSearchInput from '../shared/TextSearchInput';
import DepartmentGroupFilter from './DepartmentGroupFilter';

const CONTROL_HEIGHT = 'h-9';

const MANAGE_BTN_CLASS =
  `inline-flex items-center justify-center ${CONTROL_HEIGHT} px-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-neutral transition-colors whitespace-nowrap shrink-0`;

const ADD_BTN_CLASS =
  `inline-flex items-center justify-center gap-1.5 ${CONTROL_HEIGHT} btn-primary px-3 rounded-lg text-sm shadow-sm shrink-0`;

const MOBILE_SEARCH_INPUT_CLASS =
  'h-9 pl-3 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white hover:bg-neutral outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors';

const searchInputProps = (search, onSearchChange, loading, onReset) => ({
  value: search,
  onChange: onSearchChange,
  placeholder: ADMIN_UI.searchPlaceholderDepartments,
  withApplyButton: true,
  showDesktopApplyLabel: true,
  applyLabel: STATISTICS_UI.applyFilter,
  disabled: loading,
  onReset,
});

function ActionButtons({ onManageGroups, manageGroupsLabel, onAdd, excelControl, newButtonLabel }) {
  return (
    <>
      <div className="flex flex-col gap-2 w-full lg:hidden">
        <button type="button" onClick={onManageGroups} className={`${MANAGE_BTN_CLASS} w-full`}>
          {manageGroupsLabel}
        </button>
        <div className="flex items-center gap-2 w-full min-w-0">
          <button type="button" onClick={onAdd} className={`${ADD_BTN_CLASS} flex-1 min-w-0`}>
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
      </div>

      <div className="hidden lg:flex items-center gap-2 lg:ml-auto shrink-0 min-w-0">
        <button type="button" onClick={onManageGroups} className={MANAGE_BTN_CLASS}>
          {manageGroupsLabel}
        </button>
        <button type="button" onClick={onAdd} className={ADD_BTN_CLASS}>
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{newButtonLabel}</span>
        </button>
        {excelControl && (
          <div className="shrink-0 [&_button]:h-9 [&_button]:px-3">{excelControl}</div>
        )}
      </div>
    </>
  );
}

const DepartmentFilterBar = memo(function DepartmentFilterBar({
  groups,
  groupFilter,
  onGroupFilterChange,
  onManageGroups,
  search,
  onSearchChange,
  onAdd,
  excelControl,
  onResetFilters,
  loading = false,
}) {
  const d = ADMIN_UI.departments;
  const searchProps = searchInputProps(search, onSearchChange, loading, onResetFilters);
  const applied = { group: groupFilter, search };
  const { draft, patchDraft } = useFilterDraft(applied);

  const applyMobileFilters = useCallback(() => {
    onGroupFilterChange(draft.group);
    onSearchChange(draft.search);
  }, [draft.group, draft.search, onGroupFilterChange, onSearchChange]);

  const actionProps = {
    onManageGroups,
    manageGroupsLabel: d.manageGroupsButton,
    onAdd,
    excelControl,
    newButtonLabel: d.newButton,
  };

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <div className="flex flex-col gap-2 lg:hidden">
        <DepartmentGroupFilter
          groups={groups}
          value={draft.group}
          onChange={(group) => patchDraft({ group })}
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
            placeholder={ADMIN_UI.searchPlaceholderDepartments}
            widthClass="w-full"
            inputClassName={MOBILE_SEARCH_INPUT_CLASS}
            showSearchIcon={false}
          />
        </MobileFilterInputRow>
        <ActionButtons {...actionProps} />
      </div>

      <div className="hidden lg:flex lg:items-center lg:gap-2 w-full min-w-0">
        <DepartmentGroupFilter
          groups={groups}
          value={groupFilter}
          onChange={onGroupFilterChange}
          className="w-[200px] shrink-0"
        />
        <RegistrySearchInput
          {...searchProps}
          widthClass="flex-1 min-w-[12rem] max-w-md"
        />
        <ActionButtons {...actionProps} />
      </div>
    </div>
  );
});

export default DepartmentFilterBar;
