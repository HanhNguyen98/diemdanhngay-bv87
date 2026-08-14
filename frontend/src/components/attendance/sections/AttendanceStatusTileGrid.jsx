import { memo } from 'react';
import { normalizeStatusBreakdown } from '../../../utils/statusBreakdown';
import AttendanceStatusTile from './AttendanceStatusTile';
import MobileHorizontalScroll from '../../shared/MobileHorizontalScroll';

export const DESKTOP_STATUS_COLUMNS = 4;
export const DESKTOP_STATUS_ROWS = 2;

const SCROLL_INNER_CLASS = 'gap-2 snap-x snap-mandatory pb-0.5 pr-1 w-full';

const AttendanceStatusTileScrollRow = memo(function AttendanceStatusTileScrollRow({
  items,
  className = '',
}) {
  const showScrollPeek = items.length > 3;

  return (
    <MobileHorizontalScroll
      className={className}
      ariaLabel="Thống kê theo trạng thái"
      innerClassName={SCROLL_INNER_CLASS}
      showFade={showScrollPeek}
    >
      {items.map((item) => (
        <AttendanceStatusTile
          key={item.code}
          label={item.badgeLabel || item.label}
          count={item.count}
          colorKey={item.colorKey}
          iconKey={item.iconKey}
          children={item.children}
          peek
        />
      ))}
    </MobileHorizontalScroll>
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
            children={item.children}
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
            children={item.children}
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
          children={item.children}
          fluid
        />
      ))}
    </div>
  );
});

export default AttendanceStatusTileGrid;
