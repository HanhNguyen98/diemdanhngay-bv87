import { memo, useCallback, useState } from 'react';
import StatusCatalogCard from './StatusCatalogCard';

const StatusCatalogCardList = memo(function StatusCatalogCardList({
  items,
  onEdit,
  onDelete,
  onToggleActive,
}) {
  const [togglingId, setTogglingId] = useState(null);

  const handleToggle = useCallback(
    async (item) => {
      if (!item || togglingId === item.id) return;
      try {
        setTogglingId(item.id);
        await onToggleActive(item);
      } catch (err) {
        // Prevent unhandled promise errors; page-level error UX is handled by existing update flows.
        console.error('Toggle status active failed:', err);
      } finally {
        setTogglingId(null);
      }
    },
    [onToggleActive, togglingId],
  );

  if (!items?.length) {
    // Keep empty-state minimal; page already handles global empty.
    return null;
  }

  return (
    <div className="p-3 flex flex-col gap-3" role="list" aria-label="Danh sách trạng thái làm việc">
      {items.map((item) => (
        <StatusCatalogCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={handleToggle}
          toggling={togglingId === item.id}
        />
      ))}
    </div>
  );
});

export default StatusCatalogCardList;

