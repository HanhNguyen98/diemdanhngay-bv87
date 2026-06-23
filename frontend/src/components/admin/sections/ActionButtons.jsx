import { memo } from 'react';

export const ActionBtn = memo(function ActionBtn({
  icon: Icon,
  onClick,
  colorClass,
  label,
  disabled = false,
  title,
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={label}
      title={title || label}
      className={`w-8 h-8 rounded-lg border border-line flex items-center justify-center transition-colors ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${colorClass}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
});
