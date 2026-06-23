import { memo } from 'react';
import { UI } from '../../constants/attendance';

const AppFooter = memo(function AppFooter({ className = '' }) {
  return (
    <footer
      className={`shrink-0 border-t border-gray-200 bg-surface-white px-5 py-2 max-lg:pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] ${className}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-2 text-3xs text-content-muted text-center min-w-0 max-w-full break-words">
        <span className="lg:hidden">{UI.footerCopyrightMobile}</span>
        <span className="hidden lg:inline">{UI.footerCopyright}</span>
      </div>
    </footer>
  );
});

export default AppFooter;
