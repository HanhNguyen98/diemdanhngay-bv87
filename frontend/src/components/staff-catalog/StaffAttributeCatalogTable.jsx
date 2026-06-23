import { memo } from 'react';
import StaffAttributeCatalogRow from './StaffAttributeCatalogRow';

const StaffAttributeCatalogTable = memo(function StaffAttributeCatalogTable({
  items,
  config,
  onEdit,
  onDelete,
}) {
  const ui = config.ui();

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="table-header-row">
          <th className="table-th-left">{ui.columns.code}</th>
          <th className="table-th-left">{ui.columns.name}</th>
          <th className="table-th-left">{ui.columns.sort}</th>
          <th className="table-th-left">{ui.columns.usage}</th>
          <th className="table-th-left">{ui.columns.status}</th>
          <th className="table-th-right">{ui.columns.actions}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <StaffAttributeCatalogRow
            key={item[config.codeField]}
            item={item}
            config={config}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </tbody>
    </table>
  );
});

export default StaffAttributeCatalogTable;
