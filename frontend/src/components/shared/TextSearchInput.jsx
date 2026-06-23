import { memo } from 'react';
import { Search, X } from 'lucide-react';

/** Mobile placeholder — đồng bộ màn phân quyền người dùng */
const MOBILE_PLACEHOLDER_CLASS = 'max-lg:placeholder:text-3xs max-lg:placeholder:leading-tight';

const DEFAULT_INPUT_CLASS =
  'h-8 pl-9 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white hover:bg-neutral outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors';

const TextSearchInput = memo(function TextSearchInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className = '',
  inputClassName = DEFAULT_INPUT_CLASS,
  widthClass = 'w-full sm:w-[260px]',
  clearLabel = 'Xóa tìm kiếm',
  showSearchIcon = true,
}) {
  const hasValue = Boolean(value);

  return (
    <div className={`relative ${widthClass} ${className}`}>
      {showSearchIcon && (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`w-full ${hasValue ? 'pr-8' : 'pr-3'} ${inputClassName} ${!showSearchIcon ? '!pl-3' : ''} ${MOBILE_PLACEHOLDER_CLASS}`}
        aria-label={placeholder}
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center text-content-muted hover:text-gray-800 hover:bg-neutral transition-colors"
          aria-label={clearLabel}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
});

export default TextSearchInput;
