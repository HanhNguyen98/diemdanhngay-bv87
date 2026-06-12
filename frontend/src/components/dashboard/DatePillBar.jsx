import { memo, useRef, useState, useCallback, useMemo } from 'react';
import { UI } from '../../constants/attendance';
import { formatShortDate, todayISO } from '../../utils/formatters';
import { IconCalendar } from '../icons/Icons';
import DatePickerPopover from '../ui/DatePickerPopover';

const PILL_STYLES = {
  default: {
    selected: 'bg-primary text-white shadow-sm',
    unselected:
      'bg-surface-white dark:bg-dark-sidebar border border-line dark:border-dark-border text-content-muted hover:border-primary hover:text-primary',
    calendarIdle:
      'border-line dark:border-dark-border bg-surface-white dark:bg-dark-sidebar text-content-muted hover:border-primary',
    calendarActive: 'border-primary bg-primary-light text-primary',
  },
  attendance: {
    selected: 'bg-primary text-white shadow-sm font-semibold',
    unselected: 'bg-[#E6EEFE] text-slate-600 hover:bg-[#D9E4FC]',
    calendarIdle: 'border-transparent bg-[#E6EEFE] text-slate-500 hover:bg-[#D9E4FC]',
    calendarActive: 'border-primary bg-primary text-white',
  },
};

const DatePill = memo(function DatePill({ label, isSelected, onClick, compact, variant }) {
  const styles = PILL_STYLES[variant] || PILL_STYLES.default;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg font-medium transition-colors duration-150 ${
        compact ? 'min-w-[60px] px-2.5 py-1.5 text-xs' : 'min-w-[72px] px-4 py-2.5 text-sm'
      } ${isSelected ? styles.selected : styles.unselected}`}
      aria-pressed={isSelected}
    >
      {label}
    </button>
  );
});

function DatePillBar({
  selectedDate,
  recentDates,
  onDateChange,
  compact = false,
  variant = 'default',
  maxDate,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const calendarBtnRef = useRef(null);
  const styles = PILL_STYLES[variant] || PILL_STYLES.default;
  const effectiveMaxDate = maxDate ?? (variant === 'attendance' ? todayISO() : undefined);

  const isCustomDate = useMemo(
    () => !recentDates.includes(selectedDate),
    [recentDates, selectedDate],
  );

  const handlePillClick = useCallback(
    (date) => {
      if (date !== selectedDate) onDateChange(date);
    },
    [selectedDate, onDateChange],
  );

  const handlePickerChange = useCallback(
    (date) => {
      onDateChange(date);
    },
    [onDateChange],
  );

  const calendarHighlighted = pickerOpen || isCustomDate;

  return (
    <div className="relative flex flex-nowrap items-center justify-start sm:justify-center gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
      {recentDates.map((date, idx) => (
        <DatePill
          key={date}
          label={idx === 0 ? UI.today : formatShortDate(date)}
          isSelected={date === selectedDate}
          onClick={() => handlePillClick(date)}
          compact={compact}
          variant={variant}
        />
      ))}

      <div className="relative">
        <button
          ref={calendarBtnRef}
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          aria-label="Chọn ngày khác"
          aria-expanded={pickerOpen}
          className={`inline-flex items-center justify-center rounded-lg border transition-colors duration-150 ${
            compact ? 'w-8 h-8' : 'w-10 h-10'
          } ${calendarHighlighted ? styles.calendarActive : styles.calendarIdle}`}
        >
          <IconCalendar className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
        </button>

        {pickerOpen && (
          <DatePickerPopover
            value={selectedDate}
            maxDate={effectiveMaxDate}
            onChange={handlePickerChange}
            onClose={() => setPickerOpen(false)}
            anchorRef={calendarBtnRef}
          />
        )}
      </div>
    </div>
  );
}

export default memo(DatePillBar);
