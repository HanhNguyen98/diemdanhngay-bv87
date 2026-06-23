import StaffAttributeCatalogCard from './StaffAttributeCatalogCard';

export default function StaffAttributeCatalogCardList({
  items,
  config,
  onEdit,
  onDelete,
  onToggleActive,
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <StaffAttributeCatalogCard
          key={item[config.codeField]}
          item={item}
          config={config}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
        />
      ))}
    </div>
  );
}
