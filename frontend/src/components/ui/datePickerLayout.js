export const POPOVER_WIDTH = 300;
export const VIEWPORT_MARGIN = 8;
export const ANCHOR_GAP = 8;

/**
 * Fixed position for calendar popovers; centers when anchor spans most of the viewport.
 */
export function computePopoverFixedPosition(anchorRect, popoverHeight, popoverWidth = POPOVER_WIDTH) {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  const anchorWide = anchorRect.width > viewportW * 0.55;
  let left = anchorWide
    ? (viewportW - popoverWidth) / 2
    : anchorRect.right - popoverWidth;
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, viewportW - popoverWidth - VIEWPORT_MARGIN));

  let top = anchorRect.bottom + ANCHOR_GAP;
  if (top + popoverHeight > viewportH - VIEWPORT_MARGIN) {
    top = anchorRect.top - popoverHeight - ANCHOR_GAP;
  }
  top = Math.max(VIEWPORT_MARGIN, Math.min(top, viewportH - popoverHeight - VIEWPORT_MARGIN));

  return { top, left };
}
