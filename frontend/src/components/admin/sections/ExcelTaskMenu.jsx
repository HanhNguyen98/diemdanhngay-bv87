import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { ADMIN_UI } from '../../../constants/admin';

const ExcelTaskMenu = memo(function ExcelTaskMenu({
  onTemplate,
  onImport,
  onExport,
  disabled = false,
  importing = false,
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const fileInputRef = useRef(null);

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (
        menuRef.current?.contains(event.target) ||
        buttonRef.current?.contains(event.target)
      ) {
        return;
      }
      closeMenu();
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') closeMenu();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, closeMenu]);

  const handleImportClick = () => {
    closeMenu();
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onImport(file);
  };

  const { excel } = ADMIN_UI;
  const label = importing ? excel.importing : compact ? excel.menuLabelShort : excel.menuLabel;

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled || importing}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1 rounded-lg border border-line text-content-muted hover:bg-neutral transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap ${
          compact ? 'h-9 px-2.5 text-xs justify-center' : 'h-8 px-2.5 text-sm gap-1.5'
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={compact ? excel.menuLabel : undefined}
      >
        <FileSpreadsheet className={`${compact ? 'w-4 h-4' : 'w-3.5 h-3.5'} shrink-0`} />
        <span className="truncate">{label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 min-w-[220px] rounded-lg border border-line bg-white py-1 shadow-panel animate-fade-in"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onTemplate();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-content-body hover:bg-neutral transition-colors text-left"
          >
            <Download className="w-3.5 h-3.5 text-content-muted shrink-0" />
            {excel.template}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleImportClick}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-content-body hover:bg-neutral transition-colors text-left"
          >
            <Upload className="w-3.5 h-3.5 text-content-muted shrink-0" />
            {excel.import}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onExport();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-content-body hover:bg-neutral transition-colors text-left"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-content-muted shrink-0" />
            {excel.export}
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  );
});

export default ExcelTaskMenu;
