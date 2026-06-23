import { memo, useCallback } from 'react';
import { useDraggableFab } from '../../hooks/useDraggableFab';

const FAB_BASE_CLASS =
  'fixed z-40 flex items-center gap-2 h-11 px-4 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors touch-none select-none cursor-grab active:cursor-grabbing';

/**
 * Floating AI launcher — draggable anywhere; click opens panel unless user dragged.
 */
const DraggableAiFab = memo(function DraggableAiFab({
  storageKey,
  getDefaultPosition,
  onActivate,
  disabled = false,
  className = '',
  ariaLabel,
  title,
  children,
}) {
  const {
    fabRef,
    position,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    consumeClickIfDragged,
  } = useDraggableFab({ storageKey, getDefaultPosition });

  const handleClick = useCallback(() => {
    if (consumeClickIfDragged()) return;
    if (!disabled) onActivate();
  }, [consumeClickIfDragged, disabled, onActivate]);

  if (!position) {
    return null;
  }

  return (
    <button
      ref={fabRef}
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      disabled={disabled}
      style={{ left: position.x, top: position.y }}
      className={`${FAB_BASE_CLASS} ${className}`.trim()}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
});

export default DraggableAiFab;
