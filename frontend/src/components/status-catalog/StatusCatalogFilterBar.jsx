import { memo } from 'react';
import { ADMIN_UI } from '../../constants/admin';
import { STATISTICS_UI } from '../../constants/attendance';
import RegistrySearchInput from '../admin/sections/RegistrySearchInput';
import CatalogToolbarActions from '../admin/sections/CatalogToolbarActions';

const StatusCatalogFilterBar = memo(function StatusCatalogFilterBar({
  search,
  onSearchChange,
  onAdd,
  excelControl,
  onResetFilters,
  loading = false,
}) {
  const c = ADMIN_UI.statusCatalog;
  const searchProps = {
    value: search,
    onChange: onSearchChange,
    placeholder: c.searchPlaceholder,
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
          newButtonLabel={c.newButton}
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
          newButtonLabel={c.newButton}
          excelControl={excelControl}
        />
      </div>
    </div>
  );
});

export default StatusCatalogFilterBar;
