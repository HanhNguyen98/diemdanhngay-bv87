import { memo } from 'react';
import { ADMIN_UI } from '../../constants/admin';
import RegistryTableEmptyRow from '../admin/sections/RegistryTableEmptyRow';
import StatusCatalogRow from './StatusCatalogRow';

const COL_SPAN = 7;

const StatusCatalogTable = memo(function StatusCatalogTable({ items, onEdit, onDelete }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="table-header-row">
          <th className="table-th-left">{ADMIN_UI.statusCatalog.columns.code}</th>
          <th className="table-th-left">{ADMIN_UI.statusCatalog.columns.label}</th>
          <th className="table-th-left">{ADMIN_UI.statusCatalog.columns.badge}</th>
          <th className="table-th-left">{ADMIN_UI.statusCatalog.columns.sort}</th>
          <th className="table-th-left">{ADMIN_UI.statusCatalog.columns.usage}</th>
          <th className="table-th-left">{ADMIN_UI.statusCatalog.columns.status}</th>
          <th className="table-th-right">{ADMIN_UI.statusCatalog.columns.actions}</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <RegistryTableEmptyRow colSpan={COL_SPAN} />
        ) : (
          items.map((item) => (
            <StatusCatalogRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </tbody>
    </table>
  );
});

export default StatusCatalogTable;
