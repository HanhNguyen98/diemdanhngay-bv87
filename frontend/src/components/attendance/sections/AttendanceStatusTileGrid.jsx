import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { normalizeStatusBreakdown } from '../../../utils/statusBreakdown';
import AttendanceStatusTile from './AttendanceStatusTile';

export const DESKTOP_STATUS_COLUMNS = 4;
export const DESKTOP_STATUS_ROWS = 2;

const AttendanceStatusTileScrollRow = memo(function AttendanceStatusTileScrollRow({
  items,
  className = '',
}) {
  const scrollRef = useRef(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const showScrollPeek = items.length > 3;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 6;
    setScrolledToEnd(atEnd);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length, updateScrollState]);

  const showRightFade = showScrollPeek && !scrolledToEnd;

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-0.5 pr-1 w-full"
        role="list"
        aria-label="Thống kê theo trạng thái"
      >
        {items.map((item) => (
          <AttendanceStatusTile
            key={item.code}
            label={item.badgeLabel || item.label}
            count={item.count}
            colorKey={item.colorKey}
            iconKey={item.iconKey}
            peek
          />
        ))}
      </div>
      {showRightFade && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface-page from-30% via-surface-page/80 to-transparent"
          aria-hidden="true"
        />
      )}
    </div>
  );
});

const AttendanceStatusTileGrid = memo(function AttendanceStatusTileGrid({
  statusBreakdown,
  className = '',
  fluid = false,
  columns = null,
  scroll = false,
}) {
  const items = normalizeStatusBreakdown(statusBreakdown);
  if (!items.length) return null;

  if (scroll) {
    return <AttendanceStatusTileScrollRow items={items} className={className} />;
  }

  if (columns === DESKTOP_STATUS_COLUMNS) {
    return (
      <div
        className={`grid grid-cols-4 grid-rows-2 gap-2 flex-1 min-w-0 min-h-[10rem] ${className}`}
        aria-label="Thống kê theo trạng thái"
      >
        {items.map((item) => (
          <AttendanceStatusTile
            key={item.code}
            label={item.badgeLabel || item.label}
            count={item.count}
            colorKey={item.colorKey}
            iconKey={item.iconKey}
            fluid
          />
        ))}
      </div>
    );
  }

  if (fluid) {
    return (
      <div className={className} aria-label="Thống kê theo trạng thái">
        {items.map((item) => (
          <AttendanceStatusTile
            key={item.code}
            label={item.badgeLabel || item.label}
            count={item.count}
            colorKey={item.colorKey}
            iconKey={item.iconKey}
            fluid
          />
        ))}
      </div>
    );
  }

  return (
    <div className={className} aria-label="Thống kê theo trạng thái">
      {items.map((item) => (
        <AttendanceStatusTile
          key={item.code}
          label={item.badgeLabel || item.label}
          count={item.count}
          colorKey={item.colorKey}
          iconKey={item.iconKey}
          fluid
        />
      ))}
    </div>
  );
});

export default AttendanceStatusTileGrid;
