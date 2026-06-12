import { memo } from 'react';

export const ActionBtn = memo(function ActionBtn({ icon: Icon, onClick, colorClass, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center transition-colors ${colorClass}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
});
