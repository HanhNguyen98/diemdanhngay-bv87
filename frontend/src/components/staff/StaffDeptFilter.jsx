import { memo } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';

const StaffDeptFilter = memo(function StaffDeptFilter({ departments, value, onChange }) {
  return (
    <div className="relative">
      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
        className="appearance-none h-8 pl-9 pr-9 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white hover:bg-neutral outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-colors w-[300px] max-w-full"
        aria-label={ADMIN_UI.staff.deptFilterLabel}
      >
        <option value="">{ADMIN_UI.staff.deptFilterAll}</option>
        {departments.map((d) => (
          <option key={d.deptCode} value={d.deptCode}>
            [{d.deptCodeFormatted}] {d.deptName}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
    </div>
  );
});

export default StaffDeptFilter;
