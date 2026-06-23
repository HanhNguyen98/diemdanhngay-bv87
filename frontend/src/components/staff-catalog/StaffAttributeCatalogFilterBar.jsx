import { memo } from 'react';
import { STATISTICS_UI } from '../../constants/attendance';
import RegistrySearchInput from '../admin/sections/RegistrySearchInput';
import CatalogToolbarActions from '../admin/sections/CatalogToolbarActions';

const StaffAttributeCatalogFilterBar = memo(function StaffAttributeCatalogFilterBar({
  config,
  search,
  onSearchChange,
  onAdd,
  excelControl,
  onResetFilters,
  loading = false,
}) {
  const ui = config.ui();
  const searchProps = {
    value: search,
    onChange: onSearchChange,
    placeholder: ui.searchPlaceholder,
    withApplyButton: true,
    showDesktopApplyLabel: true,
    applyLabel: STATISTICS_UI.applyFilter,
    disabled: loading,
    onReset: onResetFilters,
  };

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <div className="flex flex-col gap-2 lg:hidden">
        <RegistrySearchInput {...searchProps} widthClass="w-full" />
        <CatalogToolbarActions
          onAdd={onAdd}
          newButtonLabel={ui.newButton}
          excelControl={excelControl}
        />
      </div>

      <div className="hidden lg:flex lg:items-center lg:gap-2 w-full min-w-0">
        <RegistrySearchInput
          {...searchProps}
          widthClass="flex-1 min-w-[12rem] max-w-md"
        />
        <CatalogToolbarActions
          onAdd={onAdd}
          newButtonLabel={ui.newButton}
          excelControl={excelControl}
        />
      </div>
    </div>
  );
});

export default StaffAttributeCatalogFilterBar;
