import { memo, useCallback, useEffect, useRef, useState } from 'react';

/**
 * Two-layer horizontal scroll strip for mobile carousels.
 * Outer clips overflow; inner scrolls with overscroll-x containment so the page does not pan sideways.
 */
const MobileHorizontalScroll = memo(function MobileHorizontalScroll({
  children,
  className = '',
  innerClassName = '',
  ariaLabel,
  showFade = false,
  fadeFromClass = 'from-surface-page',
}) {
  const scrollRef = useRef(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 1;
    setCanScroll(overflow);
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
  }, [updateScrollState, children]);

  const showRightFade = showFade && canScroll && !scrolledToEnd;

  return (
    <div className={`mobile-h-scroll-outer relative ${className}`}>
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className={`mobile-h-scroll-inner flex scrollbar-none ${innerClassName}`}
        role={ariaLabel ? 'list' : undefined}
        aria-label={ariaLabel}
      >
        {children}
      </div>
      {showRightFade && (
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l ${fadeFromClass} from-30% via-surface-page/80 to-transparent`}
          aria-hidden="true"
        />
      )}
    </div>
  );
});

export default MobileHorizontalScroll;
