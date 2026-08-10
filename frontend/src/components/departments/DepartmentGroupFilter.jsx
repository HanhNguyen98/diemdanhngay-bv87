import { memo } from 'react';
import { Layers, ChevronDown } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';

const DepartmentGroupFilter = memo(function DepartmentGroupFilter({
  groups,
  value,
  onChange,
  className = '',
}) {
  const d = ADMIN_UI.departments;

  return (
    <div className={`relative ${className}`}>
      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : '')}
        className={`appearance-none h-9 pl-9 pr-9 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white hover:bg-neutral outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors w-full ${value === '' ? 'text-content-muted' : ''
          }`}
        aria-label={d.groupFilterLabel}
      >
        <option value="">{d.groupFilterPlaceholder}</option>
        {groups.map((g) => (
          <option key={g.groupCode} value={g.groupCode}>
            {g.groupName}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
    </div>
  );
});

export default DepartmentGroupFilter;
