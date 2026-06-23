import { useCallback, useLayoutEffect, useRef, useState } from 'react';

const DRAG_THRESHOLD_PX = 6;
const VIEWPORT_PADDING_PX = 8;
const FAB_FALLBACK_WIDTH = 132;
const FAB_FALLBACK_HEIGHT = 44;

export function clampFabPosition(x, y, width, height) {
  if (typeof window === 'undefined') {
    return { x, y };
  }
  const maxX = Math.max(VIEWPORT_PADDING_PX, window.innerWidth - width - VIEWPORT_PADDING_PX);
  const maxY = Math.max(VIEWPORT_PADDING_PX, window.innerHeight - height - VIEWPORT_PADDING_PX);
  return {
    x: Math.min(Math.max(VIEWPORT_PADDING_PX, x), maxX),
    y: Math.min(Math.max(VIEWPORT_PADDING_PX, y), maxY),
  };
}

function positionFromInsets(insets, width, height) {
  return clampFabPosition(
    window.innerWidth - insets.right - width,
    window.innerHeight - insets.bottom - height,
    width,
    height,
  );
}

function readSavedPosition(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!Number.isFinite(saved?.x) || !Number.isFinite(saved?.y)) return null;
    return { x: saved.x, y: saved.y };
  } catch {
    return null;
  }
}

function sessionPlacementKey(storageKey) {
  return `${storageKey}-placed`;
}

function hasSessionPlacement(storageKey) {
  try {
    return sessionStorage.getItem(sessionPlacementKey(storageKey)) === '1';
  } catch {
    return false;
  }
}

function markSessionPlacement(storageKey) {
  try {
    sessionStorage.setItem(sessionPlacementKey(storageKey), '1');
  } catch {
    /* ignore */
  }
}

/**
 * Draggable floating action button — default bottom-right; drag persists only after user moves it.
 */
export function useDraggableFab({ storageKey, getDefaultPosition }) {
  const fabRef = useRef(null);
  const positionRef = useRef(null);
  const userPlacedRef = useRef(false);
  const dragRef = useRef({
    active: false,
    moved: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const [position, setPosition] = useState(null);

  const measureSize = useCallback(() => {
    const el = fabRef.current;
    return {
      width: el?.offsetWidth ?? FAB_FALLBACK_WIDTH,
      height: el?.offsetHeight ?? FAB_FALLBACK_HEIGHT,
    };
  }, []);

  const measureAndClamp = useCallback((x, y) => {
    const { width, height } = measureSize();
    return clampFabPosition(x, y, width, height);
  }, [measureSize]);

  const anchorToDefault = useCallback(() => {
    const insets = getDefaultPosition();
    const { width, height } = measureSize();
    return positionFromInsets(insets, width, height);
  }, [getDefaultPosition, measureSize]);

  const persistPosition = useCallback(
    (next, userPlaced = userPlacedRef.current) => {
      positionRef.current = next;
      setPosition(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify({ ...next, userPlaced }));
      } catch {
        /* ignore quota errors */
      }
    },
    [storageKey],
  );

  const applyInitialPosition = useCallback(() => {
    const saved = readSavedPosition(storageKey);
    if (saved && hasSessionPlacement(storageKey)) {
      userPlacedRef.current = true;
      const clamped = measureAndClamp(saved.x, saved.y);
      positionRef.current = clamped;
      setPosition(clamped);
      return;
    }

    userPlacedRef.current = false;
    const anchored = anchorToDefault();
    positionRef.current = anchored;
    setPosition(anchored);
  }, [anchorToDefault, measureAndClamp, storageKey]);

  useLayoutEffect(() => {
    applyInitialPosition();
  }, [applyInitialPosition]);

  // Re-measure after first paint so width/label matches real FAB size.
  useLayoutEffect(() => {
    if (!position || userPlacedRef.current) return;
    const anchored = anchorToDefault();
    if (anchored.x !== position.x || anchored.y !== position.y) {
      positionRef.current = anchored;
      setPosition(anchored);
    }
  }, [anchorToDefault, position]);

  useLayoutEffect(() => {
    if (!position) return undefined;

    const handleResize = () => {
      const next = userPlacedRef.current
        ? measureAndClamp(positionRef.current.x, positionRef.current.y)
        : anchorToDefault();
      persistPosition(next, userPlacedRef.current);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [anchorToDefault, measureAndClamp, persistPosition, position]);

  const handlePointerDown = useCallback((event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (!positionRef.current || !fabRef.current) return;

    dragRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: positionRef.current.x,
      originY: positionRef.current.y,
    };
    fabRef.current.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag.active || event.pointerId !== drag.pointerId) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;

      if (!drag.moved && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
        drag.moved = true;
      }

      if (drag.moved) {
        event.preventDefault();
        const next = measureAndClamp(drag.originX + dx, drag.originY + dy);
        positionRef.current = next;
        setPosition(next);
      }
    },
    [measureAndClamp],
  );

  const finishDrag = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag.active || event.pointerId !== drag.pointerId) return;

      drag.active = false;
      fabRef.current?.releasePointerCapture(event.pointerId);

      if (drag.moved && positionRef.current) {
        userPlacedRef.current = true;
        markSessionPlacement(storageKey);
        persistPosition(positionRef.current, true);
      }
    },
    [persistPosition],
  );

  const consumeClickIfDragged = useCallback(() => {
    const moved = dragRef.current.moved;
    dragRef.current.moved = false;
    return moved;
  }, []);

  return {
    fabRef,
    position,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: finishDrag,
    handlePointerCancel: finishDrag,
    consumeClickIfDragged,
  };
}
