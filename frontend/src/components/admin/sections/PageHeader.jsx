import { memo } from 'react';
import { Plus } from 'lucide-react';

const PageHeader = memo(function PageHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        <p className="text-sm text-content-muted mt-1.5">{subtitle}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl shadow-sm"
        >
          <Plus className="w-5 h-5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
});

export default PageHeader;
