import { memo, useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { IconChevronLeft, IconChevronRight } from '../icons/Icons';
import {
  parseISODate,
  getCalendarGrid,
  getMonthLabel,
  getWeekdayLabels,
} from '../../utils/dateUtils';
import { compareISODate, todayISO } from '../../utils/formatters';
import { DATE_RANGE_PICKER_UI } from '../../constants/attendance';
import { POPOVER_WIDTH, computePopoverFixedPosition } from './datePickerLayout';

const WEEKDAYS = getWeekdayLabels();

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

function normalizeRange(start, end) {
  if (!start || !end) return { from: start, to: end };
  if (compareISODate(start, end) <= 0) return { from: start, to: end };
  return { from: end, to: start };
}

function isInRange(iso, from, to) {
  if (!iso || !from || !to) return false;
  return compareISODate(iso, from) >= 0 && compareISODate(iso, to) <= 0;
}

const RangeDayCell = memo(function RangeDayCell({
  iso,
  draftStart,
  draftEnd,
  today,
  disabled,
  onSelect,
}) {
  if (!iso) {
    return <div className="h-9" aria-hidden="true" />;
  }

  const day = Number(iso.split('-')[2]);
  const { from, to } = normalizeRange(draftStart, draftEnd);
  const inRange = isInRange(iso, from, to);
  const isStart = iso === from;
  const isEnd = iso === to;
  const isToday = iso === today;
  const singleDay = from && to && from === to;

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

  let cellClass =
    'h-9 w-9 mx-auto text-sm font-medium transition-colors flex items-center justify-center ';
  if (inRange) {
    if (singleDay && isStart) {
      cellClass += 'rounded-lg bg-primary text-white shadow-sm';
    } else if (isStart) {
      cellClass += 'rounded-l-lg bg-primary text-white';
    } else if (isEnd) {
      cellClass += 'rounded-r-lg bg-primary text-white';
    } else {
      cellClass += 'rounded-none bg-primary-light text-primary';
    }
  } else if (isToday) {
    cellClass += 'rounded-lg bg-primary-light text-primary ring-1 ring-primary/30';
  } else {
    cellClass += 'rounded-lg text-content-muted hover:bg-neutral';
  }

  return (
    <button type="button" onClick={() => onSelect(iso)} className={cellClass}>
      {day}
    </button>
  );
});

export default function DateRangePickerPopover({
  dateFrom,
  dateTo,
  onChange,
  onClose,
  anchorRef,
  minDate,
  maxDate,
}) {
  const popoverRef = useRef(null);
  const parsed = parseISODate(dateFrom || todayISO());
  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);
  const [draftStart, setDraftStart] = useState(dateFrom);
  const [draftEnd, setDraftEnd] = useState(dateTo);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setDraftStart(dateFrom);
    setDraftEnd(dateTo);
    const p = parseISODate(dateFrom || todayISO());
    setViewYear(p.year);
    setViewMonth(p.month);
  }, [dateFrom, dateTo]);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef?.current;
    const popover = popoverRef.current;
    if (!anchor || !popover) return;
    const height = popover.offsetHeight || 420;
    setPosition(computePopoverFixedPosition(anchor.getBoundingClientRect(), height));
  }, [anchorRef]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition, viewYear, viewMonth, draftStart, draftEnd]);

  useEffect(() => {
    const handleReposition = () => updatePosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [updatePosition]);

  useEffect(() => {
    const handlePointerOutside = (e) => {
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
    document.addEventListener('mousedown', handlePointerOutside);
    document.addEventListener('touchstart', handlePointerOutside, { passive: true });
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerOutside);
      document.removeEventListener('touchstart', handlePointerOutside);
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

      if (!draftStart || (draftStart && draftEnd)) {
        setDraftStart(iso);
        setDraftEnd(null);
        return;
      }

      const { from, to } = normalizeRange(draftStart, iso);
      onChange(from, to);
      onClose();
    },
    [draftStart, draftEnd, minDate, maxDate, onChange, onClose],
  );

  const handleClear = useCallback(() => {
    setDraftStart(null);
    setDraftEnd(null);
  }, []);

  const hint = useMemo(() => {
    if (draftStart && !draftEnd) return DATE_RANGE_PICKER_UI.pickEnd;
    return DATE_RANGE_PICKER_UI.pickStart;
  }, [draftStart, draftEnd]);

  const grid = getCalendarGrid(viewYear, viewMonth);
  const today = todayISO();
  const canGoPrev = !isMonthBefore(viewYear, viewMonth, minDate);
  const canGoNext = !isMonthAfter(viewYear, viewMonth, maxDate);

  const panel = (
    <div
      ref={popoverRef}
      style={{ top: position.top, left: position.left, width: POPOVER_WIDTH }}
      className="fixed z-[200] bg-surface-white dark:bg-dark-sidebar border border-line dark:border-dark-border rounded-xl shadow-panel p-4 animate-fade-in"
      role="dialog"
      aria-label={DATE_RANGE_PICKER_UI.ariaLabel}
    >
      <p className="text-3xs font-semibold text-content-muted uppercase tracking-wide text-center mb-3">
        {hint}
      </p>

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
          <RangeDayCell
            key={iso ?? `empty-${idx}`}
            iso={iso}
            draftStart={draftStart}
            draftEnd={draftEnd}
            today={today}
            disabled={iso ? isDateDisabled(iso, minDate, maxDate) : false}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 py-2 text-xs font-semibold text-content-muted hover:bg-neutral rounded-lg transition-colors"
        >
          {DATE_RANGE_PICKER_UI.clear}
        </button>
        <button
          type="button"
          onClick={() => {
            const { from, to } = normalizeRange(today, today);
            if (isDateDisabled(from, minDate, maxDate)) return;
            onChange(from, to);
            onClose();
          }}
          disabled={isDateDisabled(today, minDate, maxDate)}
          className="flex-1 py-2 text-xs font-semibold text-primary hover:bg-primary-light rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          {DATE_RANGE_PICKER_UI.today}
        </button>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
