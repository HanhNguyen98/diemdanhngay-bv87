import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { IconChevronLeft, IconChevronRight } from '../icons/Icons';
import {
  parseISODate,
  getCalendarGrid,
  getMonthLabel,
  getWeekdayLabels,
} from '../../utils/dateUtils';
import { compareISODate, todayISO } from '../../utils/formatters';

const WEEKDAYS = getWeekdayLabels();

const DayCell = memo(function DayCell({ iso, isSelected, isToday, disabled, onSelect }) {
  if (!iso) {
    return <div className="h-9" aria-hidden="true" />;
  }

  const day = Number(iso.split('-')[2]);

  if (disabled) {
    return (
      <div
        className="h-9 w-9 mx-auto rounded-lg text-sm font-medium text-content-muted/30 flex items-center justify-center"
        aria-hidden="true"
      >
        {day}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(iso)}
      className={`h-9 w-9 mx-auto rounded-lg text-sm font-medium transition-colors ${
        isSelected
          ? 'bg-primary text-white shadow-sm'
          : isToday
            ? 'bg-primary-light text-primary ring-1 ring-primary/30'
            : 'text-content-muted hover:bg-neutral'
      }`}
    >
      {day}
    </button>
  );
});

function isDateDisabled(iso, minDate, maxDate) {
  if (minDate && compareISODate(iso, minDate) < 0) return true;
  if (maxDate && compareISODate(iso, maxDate) > 0) return true;
  return false;
}

function isMonthAfter(year, monthIndex, maxDate) {
  if (!maxDate) return false;
  const { year: maxY, month: maxM } = parseISODate(maxDate);
  return year > maxY || (year === maxY && monthIndex > maxM);
}

function isMonthBefore(year, monthIndex, minDate) {
  if (!minDate) return false;
  const { year: minY, month: minM } = parseISODate(minDate);
  return year < minY || (year === minY && monthIndex < minM);
}

export default function DatePickerPopover({
  value,
  onChange,
  onClose,
  anchorRef,
  minDate,
  maxDate,
}) {
  const popoverRef = useRef(null);
  const parsed = parseISODate(value);
  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);

  useEffect(() => {
    const p = parseISODate(value);
    setViewYear(p.year);
    setViewMonth(p.month);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popoverRef.current?.contains(e.target) ||
        anchorRef?.current?.contains(e.target)
      ) {
        return;
      }
      onClose();
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, anchorRef]);

  const goMonth = useCallback((delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }, [viewYear, viewMonth]);

  const handleSelect = useCallback(
    (iso) => {
      if (isDateDisabled(iso, minDate, maxDate)) return;
      onChange(iso);
      onClose();
    },
    [minDate, maxDate, onChange, onClose],
  );

  const grid = getCalendarGrid(viewYear, viewMonth);
  const today = todayISO();
  const canGoPrev = !isMonthBefore(viewYear, viewMonth, minDate);
  const canGoNext = !isMonthAfter(viewYear, viewMonth, maxDate);

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 z-50 w-[300px] bg-surface-white dark:bg-dark-sidebar border border-line dark:border-dark-border rounded-xl shadow-panel p-4 animate-fade-in"
      role="dialog"
      aria-label="Chọn ngày"
    >
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => goMonth(-1)}
          disabled={!canGoPrev}
          className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-content-muted hover:bg-neutral hover:text-navy transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          aria-label="Tháng trước"
        >
          <IconChevronLeft />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-navy dark:text-white leading-tight">
            {getMonthLabel(viewMonth, viewYear)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => goMonth(1)}
          disabled={!canGoNext}
          className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-content-muted hover:bg-neutral hover:text-navy transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          aria-label="Tháng sau"
        >
          <IconChevronRight />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="h-7 flex items-center justify-center text-3xs font-bold text-content-muted uppercase"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((iso, idx) => (
          <DayCell
            key={iso ?? `empty-${idx}`}
            iso={iso}
            isSelected={iso === value}
            isToday={iso === today}
            disabled={iso ? isDateDisabled(iso, minDate, maxDate) : false}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => handleSelect(today)}
        disabled={isDateDisabled(today, minDate, maxDate)}
        className="mt-3 w-full py-2 text-xs font-semibold text-primary hover:bg-primary-light rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        Về hôm nay
      </button>
    </div>
  );
}
