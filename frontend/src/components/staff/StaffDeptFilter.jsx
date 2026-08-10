import { memo, useMemo } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import { useIsMobile } from '../../hooks/useIsMobile';
import { formatDeptFilterLabel } from '../../utils/formatters';
import SearchableSelect from '../shared/SearchableSelect';

const StaffDeptFilter = memo(function StaffDeptFilter({
  departments,
  value,
  onChange,
  className = '',
  allowEmpty = true,
  disabled = false,
}) {
  const isMobile = useIsMobile();
  const s = ADMIN_UI.staff;
  const safeDepartments = Array.isArray(departments) ? departments : [];

  const deptLabelByValue = useMemo(() => {
    const map = new Map();
    safeDepartments.forEach((dept) => {
      map.set(String(dept.deptCode), formatDeptFilterLabel(dept));
    });
    return map;
  }, [safeDepartments]);

  const deptValueByLabel = useMemo(() => {
    const map = new Map();
    safeDepartments.forEach((dept) => {
      map.set(formatDeptFilterLabel(dept), dept.deptCode);
    });
    return map;
  }, [safeDepartments]);

  const options = useMemo(() => {
    const deptLabels = safeDepartments.map((d) => formatDeptFilterLabel(d));
    return allowEmpty ? [s.deptFilterAll, ...deptLabels] : deptLabels;
  }, [allowEmpty, safeDepartments, s.deptFilterAll]);

  const selectedLabel =
    value != null ? deptLabelByValue.get(String(value)) || '' : s.deptFilterPlaceholder;

  return (
    <div className={`relative ${className}`}>
      {isMobile ? (
        <div className={disabled ? 'pointer-events-none opacity-60' : undefined}>
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none z-10" />
          <SearchableSelect
            value={value != null ? selectedLabel : ''}
            onChange={(label) => {
              if (!label || label === s.deptFilterAll) {
                if (allowEmpty) return onChange(null);
                return undefined;
              }
              const next = deptValueByLabel.get(label);
              onChange(next != null ? next : allowEmpty ? null : value);
              return undefined;
            }}
            options={options}
            placeholder={s.deptFilterPlaceholder}
            className="w-full"
            inputClassName="w-full h-9 border border-gray-200 rounded-lg pl-9 pr-16 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white"
          />
        </div>
      ) : (
        <>
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
          <select
            value={value ?? ''}
            onChange={(e) => {
              if (!e.target.value) {
                if (allowEmpty) onChange(null);
                return;
              }
              onChange(parseInt(e.target.value, 10));
            }}
            disabled={disabled}
            className={`appearance-none h-9 pl-9 pr-9 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white hover:bg-neutral outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors w-full disabled:opacity-60 disabled:cursor-not-allowed ${value == null ? 'text-content-muted' : ''
              }`}
            aria-label={s.deptFilterLabel}
          >
            {allowEmpty && <option value="">{s.deptFilterPlaceholder}</option>}
            {safeDepartments.map((d) => (
              <option key={d.deptCode} value={d.deptCode}>
                {formatDeptFilterLabel(d)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
        </>
      )}
    </div>
  );
});

export default StaffDeptFilter;
