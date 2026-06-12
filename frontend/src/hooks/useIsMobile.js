import { useState, useEffect } from 'react';

/** Khớp breakpoint `lg` của Tailwind — mobile trưởng phòng */
const MOBILE_QUERY = '(max-width: 1023px)';

/**
 * Theo dõi viewport mobile (`max-width: 1023px`) để chọn page size, layout card vs bảng.
 * @returns {boolean}
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
