import { memo } from 'react';
import { getInitials } from '../../../utils/formatters';

const StaffAvatar = memo(function StaffAvatar({ staff }) {
  if (staff.avatarUrl) {
    return (
      <img
        src={staff.avatarUrl}
        alt=""
        className="w-10 h-10 rounded-lg object-cover shrink-0 ring-1 ring-slate-200"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">
      {getInitials(staff.fullname)}
    </div>
  );
});

export default StaffAvatar;
