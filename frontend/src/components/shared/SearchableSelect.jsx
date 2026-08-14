import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { matchesSearchText } from '../../utils/searchText';

/** SPEC_ADMIN P6-Adminb — string option or `{ value, label }`. */
function isObjectOption(option) {
  return option != null && typeof option === 'object' && 'value' in option;
}

function optionValue(option) {
  if (option == null) return '';
  return isObjectOption(option) ? String(option.value ?? '') : String(option);
}

function optionLabel(option) {
  if (option == null) return '';
  if (isObjectOption(option)) {
    return String(option.label ?? option.value ?? '');
  }
  return String(option);
}

const SearchableSelect = memo(function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Tìm hoặc chọn...',
  clearLabel = 'Xóa lựa chọn',
  emptyLabel = 'Không tìm thấy kết quả',
  className = '',
  inputClassName = 'w-full h-9 border border-gray-200 rounded-lg pl-3 pr-16 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white',
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const skipQuerySyncRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const list = Array.isArray(options) ? options : [];
  const valueKey = value == null ? '' : String(value);

  const selectedOption = useMemo(
    () => list.find((opt) => optionValue(opt) === valueKey),
    [list, valueKey],
  );
  const closedDisplay = selectedOption ? optionLabel(selectedOption) : valueKey;

  const filteredOptions = useMemo(
    () => list.filter((opt) => matchesSearchText(opt, query)),
    [list, query],
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const openList = useCallback(() => {
    setOpen(true);
    if (skipQuerySyncRef.current) {
      skipQuerySyncRef.current = false;
      return;
    }
    setQuery(closedDisplay || '');
  }, [closedDisplay]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [value, open]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) {
        close();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, close]);

  const handleSelect = (option) => {
    onChange(optionValue(option));
    close();
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    skipQuerySyncRef.current = true;
    onChange('');
    setQuery('');
    setOpen(true);
  };

  const displayValue = open ? query : closedDisplay;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={displayValue}
          placeholder={placeholder}
          className={inputClassName}
          onFocus={openList}
          onClick={openList}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close();
            if (e.key === 'Enter' && filteredOptions.length === 1) {
              e.preventDefault();
              handleSelect(filteredOptions[0]);
            }
          }}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {(valueKey || (open && query)) && (
            <button
              type="button"
              onMouseDown={handleClear}
              className="w-6 h-6 rounded-md flex items-center justify-center text-content-muted hover:text-gray-800 hover:bg-neutral transition-colors"
              aria-label={clearLabel}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => (open ? close() : openList())}
            className="w-6 h-6 rounded-md flex items-center justify-center text-content-muted pointer-events-none"
            aria-hidden
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-content-muted">{emptyLabel}</li>
          ) : (
            filteredOptions.map((option) => {
              const key = optionValue(option);
              const label = optionLabel(option);
              const selected = valueKey !== '' && valueKey === key;
              return (
                <li key={key || label} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${selected
                      ? 'bg-primary-light text-primary font-medium'
                      : 'text-gray-800 hover:bg-surface-page'
                      }`}
                  >
                    {label}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
});

/** Gộp giá trị hiện có (chỉnh sửa) nếu chưa nằm trong danh mục chuẩn. */
export function withLegacyOption(options, currentValue) {
  if (!currentValue || options.includes(currentValue)) {
    return options;
  }
  return [currentValue, ...options];
}

export default SearchableSelect;
