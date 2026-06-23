import { memo, useEffect, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';
import { STATISTICS_UI } from '../../../constants/attendance';
import TextSearchInput from '../../shared/TextSearchInput';

const APPLY_INPUT_CLASS =
  'h-9 pl-3 rounded-lg border border-line text-sm text-content-body bg-white hover:bg-neutral outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors';

const RegistrySearchInput = memo(function RegistrySearchInput({
  value,
  onChange,
  placeholder,
  widthClass = 'w-full',
  inputClassName,
  showSearchIcon = true,
  withApplyButton = false,
  showDesktopApplyLabel = false,
  disabled = false,
  applyLabel = STATISTICS_UI.applyFilter,
  onReset,
  resetLabel = ADMIN_UI.resetFilters,
  resetMobileOnly = false,
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleApply = () => {
    if (draft !== value) {
      onChange(draft);
    }
  };

  const handleReset = () => {
    if (draft !== '') {
      setDraft('');
    }
    onReset?.();
  };

  if (withApplyButton) {
    return (
      <div className={`flex items-center gap-2 min-w-0 ${widthClass}`}>
        <TextSearchInput
          value={draft}
          onChange={setDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleApply();
          }}
          placeholder={placeholder}
          widthClass="flex-1 min-w-0 order-1"
          inputClassName={inputClassName || APPLY_INPUT_CLASS}
          showSearchIcon={false}
        />
        {onReset && (
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            title={resetLabel}
            aria-label={resetLabel}
            className={`order-3 h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg border border-line bg-surface-white text-content-muted hover:bg-neutral transition-colors disabled:opacity-60${resetMobileOnly ? ' lg:hidden' : ''}`}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={handleApply}
          disabled={disabled}
          className="order-2 h-9 w-9 lg:w-auto shrink-0 lg:px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-1.5 lg:gap-2 whitespace-nowrap disabled:opacity-60"
          title={applyLabel}
          aria-label={applyLabel}
        >
          <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
          {showDesktopApplyLabel ? (
            <span className="hidden lg:inline">{applyLabel}</span>
          ) : (
            <span className="sr-only">{applyLabel}</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <TextSearchInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      widthClass={widthClass}
      inputClassName={inputClassName}
      showSearchIcon={showSearchIcon}
    />
  );
});

export default RegistrySearchInput;
