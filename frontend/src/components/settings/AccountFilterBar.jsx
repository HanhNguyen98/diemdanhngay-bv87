import { memo, useCallback, useEffect, useState } from 'react';
import { Plus, ChevronDown, Shield, UserCog, Search, RotateCcw } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import { ACCOUNT_ROLE_FILTER, ACCOUNT_STATUS_FILTER } from '../../constants/adminFilters';
import { STATISTICS_UI } from '../../constants/attendance';
import { useFilterDraft } from '../../hooks/useFilterDraft';
import MobileFilterInputRow from '../admin/sections/MobileFilterInputRow';
import TextSearchInput from '../shared/TextSearchInput';

const CONTROL_HEIGHT = 'h-9';
const SELECT_CLASS = `appearance-none ${CONTROL_HEIGHT} pl-9 pr-9 rounded-lg border border-line text-sm text-content-body bg-surface-white hover:bg-neutral outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors w-full`;
const ADD_BTN_CLASS = `inline-flex items-center justify-center gap-1.5 ${CONTROL_HEIGHT} btn-primary px-3 rounded-lg text-sm shadow-sm shrink-0`;
const MOBILE_SEARCH_INPUT_CLASS =
  'h-9 pl-3 rounded-lg border border-line text-sm text-content-body bg-surface-white hover:bg-neutral outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors';

const DESKTOP_SEARCH_INPUT_CLASS =
  'h-9 pl-3 rounded-lg border border-line text-sm text-content-body bg-surface-white hover:bg-neutral outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors';

const DESKTOP_APPLY_BTN_CLASS =
  'h-9 shrink-0 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60';

const DESKTOP_RESET_BTN_CLASS =
  'h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg border border-line bg-surface-white text-content-muted hover:bg-neutral transition-colors disabled:opacity-60';

function RoleSelect({ value, onChange, disabled, placeholder, ariaLabel, options, onEnter }) {
  return (
    <div className="relative w-full min-w-0">
      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter?.();
        }}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`${SELECT_CLASS} whitespace-nowrap ${value === '' ? 'text-content-muted' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
    </div>
  );
}

function StatusSelect({ value, onChange, disabled, placeholder, ariaLabel, options, onEnter }) {
  return (
    <div className="relative w-full min-w-0">
      <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter?.();
        }}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`${SELECT_CLASS} whitespace-nowrap ${value === '' ? 'text-content-muted' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
    </div>
  );
}

const AccountFilterBar = memo(function AccountFilterBar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onAdd,
  onResetFilters,
  loading = false,
}) {
  const a = ADMIN_UI.accounts;
  const m = a.mobile;

  const roleOptions = [
    { value: ACCOUNT_ROLE_FILTER.ADMIN, label: m.roleAdmin },
    { value: ACCOUNT_ROLE_FILTER.HEAD, label: m.roleHead },
  ];

  const statusOptions = [
    { value: ACCOUNT_STATUS_FILTER.ACTIVE, label: a.active },
    { value: ACCOUNT_STATUS_FILTER.INACTIVE, label: a.inactive },
  ];

  const applied = { role: roleFilter, status: statusFilter, search };
  const { draft, patchDraft } = useFilterDraft(applied);

  const applyMobileFilters = useCallback(() => {
    onRoleFilterChange(draft.role);
    onStatusFilterChange(draft.status);
    onSearchChange(draft.search);
  }, [draft, onRoleFilterChange, onStatusFilterChange, onSearchChange]);

  const [desktopDraftSearch, setDesktopDraftSearch] = useState(search);

  useEffect(() => {
    setDesktopDraftSearch(search);
  }, [search]);

  const applyDesktopSearch = useCallback(() => {
    onSearchChange(desktopDraftSearch);
  }, [desktopDraftSearch, onSearchChange]);

  const resetDesktopFilters = useCallback(() => {
    setDesktopDraftSearch('');
    onResetFilters?.();
  }, [onResetFilters]);

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <div className="flex flex-col gap-2 lg:hidden">
        <RoleSelect
          value={draft.role}
          onChange={(role) => patchDraft({ role })}
          onEnter={applyMobileFilters}
          disabled={loading}
          placeholder={a.roleFilterPlaceholder}
          ariaLabel={m.filterRole}
          options={roleOptions}
        />
        <StatusSelect
          value={draft.status}
          onChange={(status) => patchDraft({ status })}
          onEnter={applyMobileFilters}
          disabled={loading}
          placeholder={a.statusFilterPlaceholder}
          ariaLabel={m.filterStatus}
          options={statusOptions}
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
            placeholder={a.searchPlaceholderMobile}
            widthClass="w-full"
            inputClassName={MOBILE_SEARCH_INPUT_CLASS}
            showSearchIcon={false}
          />
        </MobileFilterInputRow>
        <button type="button" onClick={onAdd} className={`${ADD_BTN_CLASS} w-full`}>
          <Plus className="w-3.5 h-3.5 shrink-0" />
          {a.newButton}
        </button>
      </div>

      <div className="hidden lg:flex lg:items-center lg:gap-2 w-full min-w-0">
        <div className="relative w-[18.5rem] shrink-0">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            disabled={loading}
            aria-label={m.filterRole}
            className={`${SELECT_CLASS} whitespace-nowrap ${roleFilter === '' ? 'text-content-muted' : ''}`}
          >
            <option value="">{a.roleFilterPlaceholder}</option>
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
        </div>

        <div className="relative w-[18.5rem] shrink-0">
          <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            disabled={loading}
            aria-label={m.filterStatus}
            className={`${SELECT_CLASS} whitespace-nowrap ${statusFilter === '' ? 'text-content-muted' : ''}`}
          >
            <option value="">{a.statusFilterPlaceholder}</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
        </div>

        <TextSearchInput
          value={desktopDraftSearch}
          onChange={setDesktopDraftSearch}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applyDesktopSearch();
          }}
          placeholder={a.searchPlaceholder}
          widthClass="flex-1 min-w-[22rem] max-w-[23rem]"
          inputClassName={DESKTOP_SEARCH_INPUT_CLASS}
          showSearchIcon={false}
        />

        <button
          type="button"
          onClick={applyDesktopSearch}
          disabled={loading}
          className={DESKTOP_APPLY_BTN_CLASS}
          aria-label={STATISTICS_UI.applyFilter}
          title={STATISTICS_UI.applyFilter}
        >
          <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{STATISTICS_UI.applyFilter}</span>
        </button>

        <button
          type="button"
          onClick={resetDesktopFilters}
          disabled={loading}
          className={DESKTOP_RESET_BTN_CLASS}
          aria-label={ADMIN_UI.resetFilters}
          title={ADMIN_UI.resetFilters}
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
        </button>

        <button type="button" onClick={onAdd} className={`${ADD_BTN_CLASS} ml-auto`}>
          <Plus className="w-3.5 h-3.5 shrink-0" />
          {a.newButton}
        </button>
      </div>
    </div>
  );
});

export default AccountFilterBar;
