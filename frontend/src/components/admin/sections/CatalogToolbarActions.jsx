import { memo, cloneElement, isValidElement } from 'react';
import { Plus } from 'lucide-react';

const ADD_BTN_CLASS =
  'inline-flex items-center justify-center gap-1.5 h-9 btn-primary px-3 rounded-lg text-sm shadow-sm shrink-0';

/**
 * Add + Excel actions row — matches DepartmentsPage toolbar layout.
 */
const CatalogToolbarActions = memo(function CatalogToolbarActions({
  onAdd,
  newButtonLabel,
  excelControl,
}) {
  return (
    <>
      <div className="flex items-center gap-2 w-full min-w-0 lg:hidden">
        <button type="button" onClick={onAdd} className={`${ADD_BTN_CLASS} flex-1 min-w-0`}>
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{newButtonLabel}</span>
        </button>
        {excelControl && (
          <div className="shrink-0">
            {isValidElement(excelControl)
              ? cloneElement(excelControl, { compact: true })
              : excelControl}
          </div>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-2 lg:ml-auto shrink-0 min-w-0">
        <button type="button" onClick={onAdd} className={ADD_BTN_CLASS}>
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{newButtonLabel}</span>
        </button>
        {excelControl && (
          <div className="shrink-0 [&_button]:h-9 [&_button]:px-3">{excelControl}</div>
        )}
      </div>
    </>
  );
});

export default CatalogToolbarActions;
