import { memo, useRef, useState, useCallback } from 'react';
import { IconCalendar } from '../icons/Icons';
import { formatDateDMY, todayISO } from '../../utils/formatters';
import DatePickerPopover from './DatePickerPopover';
import {
  DATE_PICKER_TRIGGER_ACTIVE_CLASS,
  DATE_PICKER_TRIGGER_CLASS,
  DATE_PICKER_TRIGGER_IDLE_CLASS,
} from './datePickerFieldStyles';

/**
 * Single-date trigger field; opens portal calendar popover (same as attendance DatePillBar).
 */
const DatePickerField = memo(function DatePickerField({
  value,
  onChange,
  disabled = false,
  ariaLabel,
  maxDate = todayISO(),
  minDate,
  className = '',
  triggerClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleChange = useCallback(
    (iso) => {
      onChange(iso);
    },
    [onChange],
  );

  const label = value ? formatDateDMY(value) : '—';

  return (
    <div className={`relative w-full min-w-0 ${className}`}>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className={`${DATE_PICKER_TRIGGER_CLASS} w-full ${triggerClassName} ${
          open ? DATE_PICKER_TRIGGER_ACTIVE_CLASS : DATE_PICKER_TRIGGER_IDLE_CLASS
        }`}
      >
        <span className="flex-1 min-w-0 truncate text-sm text-gray-700">{label}</span>
        <IconCalendar className="w-4 h-4 shrink-0 text-content-muted" aria-hidden="true" />
      </button>

      {open && (
        <DatePickerPopover
          value={value || todayISO()}
          onChange={handleChange}
          onClose={() => setOpen(false)}
          anchorRef={anchorRef}
          minDate={minDate}
          maxDate={maxDate}
        />
      )}
    </div>
  );
});

export default DatePickerField;
