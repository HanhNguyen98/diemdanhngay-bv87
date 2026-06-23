import { memo, useRef, useState, useCallback } from 'react';
import { IconCalendar } from '../icons/Icons';
import { formatDateDMY, todayISO } from '../../utils/formatters';
import DateRangePickerPopover from './DateRangePickerPopover';
import {
  DATE_PICKER_TRIGGER_ACTIVE_CLASS,
  DATE_PICKER_TRIGGER_CLASS,
  DATE_PICKER_TRIGGER_IDLE_CLASS,
} from './datePickerFieldStyles';

/**
 * Compact mobile date-range trigger; opens portal calendar popover (same family as attendance picker).
 */
const DateRangePickerField = memo(function DateRangePickerField({
  dateFrom,
  dateTo,
  onRangeChange,
  disabled = false,
  ariaLabel,
  maxDate = todayISO(),
  minDate,
  className = '',
  triggerClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleRangeChange = useCallback(
    (from, to) => {
      onRangeChange(from, to);
    },
    [onRangeChange],
  );

  const label =
    dateFrom && dateTo
      ? `${formatDateDMY(dateFrom)} – ${formatDateDMY(dateTo)}`
      : '—';

  const wrapperClass = className || 'w-full min-w-0';

  return (
    <div className={`relative ${wrapperClass}`}>
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
        <DateRangePickerPopover
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={handleRangeChange}
          onClose={() => setOpen(false)}
          anchorRef={anchorRef}
          minDate={minDate}
          maxDate={maxDate}
        />
      )}
    </div>
  );
});

export default DateRangePickerField;
